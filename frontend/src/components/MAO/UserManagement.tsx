import React, { useState, useEffect } from 'react';
import {
  Users,
  ShoppingCart,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  TrendingUp,
  UserX,
  RotateCcw,
  User,
  Coins,
  Briefcase,
  Shield
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiGet, apiPost, apiPut } from '../../utils/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'farmer' | 'buyer' | 'officer' | 'association_officer';
  status: 'pending' | 'verified' | 'rejected' | 'deactivated';
  association?: string;
  municipality?: string;
  businessName?: string;
  contactNumber?: string;
  position?: string;
  createdAt: string;
  deactivatedAt?: string;
}

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'farmers' | 'buyers' | 'associations'>('farmers');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'deactivated'>('all');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.association && user.association.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      let endpoint = '';
      if (activeTab === 'farmers') {
        endpoint = '/api/mao/farmers';
      } else if (activeTab === 'buyers') {
        endpoint = '/api/mao/buyers-list';
      } else if (activeTab === 'associations') {
        endpoint = '/api/mao/association-officers';
      }

      const response = await apiGet(endpoint);

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      let endpoint = '';

      if (activeTab === 'farmers') {
        endpoint = `/api/mao/farmers/${userId}`;
      } else if (activeTab === 'buyers') {
        endpoint = `/api/mao/buyers/${userId}`;
      } else if (activeTab === 'associations') {
        endpoint = `/api/mao/association-officers/${userId}`;
      }

      const response = await apiGet(endpoint);

      const data = await response.json();
      setSelectedUserDetails(data);
      setEditFormData(data); // Populate edit form with current data
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to load user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      let endpoint = '';

      if (activeTab === 'farmers') {
        endpoint = `/api/mao/farmers/${userId}/verify`;
      } else if (activeTab === 'buyers') {
        endpoint = `/api/mao/buyers/${userId}/verify`;
      } else if (activeTab === 'associations') {
        endpoint = `/api/mao/association-officers/${userId}/verify`;
      }

      const response = await apiPost(endpoint);

      if (response.ok) {
        alert('User verified successfully!');
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Failed to verify user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user');
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) return;

    try {
      let endpoint = '';

      if (activeTab === 'farmers') {
        endpoint = `/api/mao/farmers/${selectedUser.id}/reject`;
      } else if (activeTab === 'buyers') {
        endpoint = `/api/mao/buyers/${selectedUser.id}/reject`;
      } else if (activeTab === 'associations') {
        endpoint = `/api/mao/association-officers/${selectedUser.id}/reject`;
      }

      const response = await apiPost(endpoint, { reason: rejectionReason });

      if (response.ok) {
        alert('User rejected successfully!');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert('Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? They will have 3 days to be reactivated before permanent deletion.')) return;

    try {
      let endpoint = '';

      if (activeTab === 'farmers') {
        endpoint = `/api/mao/farmers/${userId}/deactivate`;
      } else if (activeTab === 'buyers') {
        endpoint = `/api/mao/buyers/${userId}/deactivate`;
      } else if (activeTab === 'associations') {
        endpoint = `/api/mao/association-officers/${userId}/deactivate`;
      }

      const response = await apiPost(endpoint);

      if (response.ok) {
        alert('User deactivated successfully! They have 3 days before permanent deletion.');
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Failed to deactivate user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user');
    }
  };

  const handleReactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to reactivate this user?')) return;

    try {
      let endpoint = '';

      if (activeTab === 'farmers') {
        endpoint = `/api/mao/farmers/${userId}/reactivate`;
      } else if (activeTab === 'buyers') {
        endpoint = `/api/mao/buyers/${userId}/reactivate`;
      } else if (activeTab === 'associations') {
        endpoint = `/api/mao/association-officers/${userId}/reactivate`;
      }

      const response = await apiPost(endpoint);

      if (response.ok) {
        alert('User reactivated successfully!');
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Failed to reactivate user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Failed to reactivate user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      let endpoint = '';

      if (activeTab === 'farmers') {
        endpoint = `/api/mao/farmers/${selectedUser.id}`;
      } else if (activeTab === 'buyers') {
        endpoint = `/api/mao/buyers/${selectedUser.id}`;
      } else if (activeTab === 'associations') {
        endpoint = `/api/mao/association-officers/${selectedUser.id}`;
      }

      const response = await apiPut(endpoint, editFormData);

      if (response.ok) {
        alert('User updated successfully!');
        setShowEditModal(false);
        fetchUsers();
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const stats = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    verified: users.filter(u => u.status === 'verified').length,
    rejected: users.filter(u => u.status === 'rejected').length,
    deactivated: users.filter(u => u.status === 'deactivated').length,
  };

  const handleExportCSV = async () => {
    if (filteredUsers.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Fetch detailed data for all users using API client
      const detailedUsers = await Promise.all(
        filteredUsers.map(async (user) => {
          let endpoint = '';
          if (activeTab === 'farmers') {
            endpoint = `/api/mao/farmers/${user.id}`;
          } else if (activeTab === 'buyers') {
            endpoint = `/api/mao/buyers/${user.id}`;
          } else if (activeTab === 'associations') {
            endpoint = `/api/mao/associations/${user.id}`;
          }

          const response = await apiGet(endpoint);
          return response.json();
        })
      );

      // Prepare CSV headers
      let headers: string[] = [];
      if (activeTab === 'farmers') {
        headers = [
          'Farmer ID',
          'Full Name',
          'Sex',
          'Age',
          'Birthday',
          'Civil Status',
          'Contact Number',
          'Email',
          'Address',
          'Barangay',
          'Municipality',
          'Association/Organization',
          'Farm Location',
          'Farm Coordinates',
          'Farm Area (ha)',
          'Years in Farming',
          'Type of Abaca Planted',
          'Average Harvest Volume (kg)',
          'Harvest Cycle Duration (Weeks)',
          'Selling Price Min (₱/kg)',
          'Selling Price Max (₱/kg)',
          'Regular Buyer',
          'Income per Cycle (₱)',
          'Verification Status',
          'Date Registered'
        ];
      } else if (activeTab === 'buyers') {
        headers = ['Business Name', 'Owner Name', 'Email', 'Contact Number', 'Business Address', 'Status', 'Date Registered'];
      } else if (activeTab === 'associations') {
        headers = ['Name', 'Email', 'Contact Number', 'Association', 'Position', 'Status', 'Date Registered'];
      }

      // Prepare CSV rows
      const rows = detailedUsers.map(user => {
        if (activeTab === 'farmers') {
          return [
            user.farmer_id || 'N/A',
            user.full_name || 'N/A',
            user.sex || 'N/A',
            user.age || 'N/A',
            user.birthday ? new Date(user.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
            user.civil_status || 'N/A',
            user.contact_number || 'N/A',
            user.email || 'N/A',
            user.address || 'N/A',
            user.barangay || 'N/A',
            user.municipality || 'N/A',
            user.association_name || 'N/A',
            user.farm_location || 'N/A',
            user.farm_coordinates || 'N/A',
            user.farm_area_hectares || 'N/A',
            user.years_in_farming || 'N/A',
            user.type_of_abaca_planted || 'N/A',
            user.average_harvest_volume_kg || 'N/A',
            user.harvest_frequency_weeks || 'N/A',
            user.selling_price_range_min || 'N/A',
            user.selling_price_range_max || 'N/A',
            user.regular_buyer || 'N/A',
            user.income_per_cycle || 'N/A',
            user.verification_status?.toUpperCase() || 'PENDING',
            new Date(user.created_at).toLocaleDateString()
          ];
        } else if (activeTab === 'buyers') {
          return [
            user.business_name || 'N/A',
            user.owner_name || 'N/A',
            user.email || 'N/A',
            user.contact_number || 'N/A',
            user.business_address || 'N/A',
            user.verification_status?.toUpperCase() || 'PENDING',
            new Date(user.created_at).toLocaleDateString()
          ];
        } else {
          return [
            user.full_name || 'N/A',
            user.email || 'N/A',
            user.contact_number || 'N/A',
            user.association_name || 'N/A',
            user.position || 'N/A',
            user.verification_status?.toUpperCase() || 'PENDING',
            new Date(user.created_at).toLocaleDateString()
          ];
        }
      });

      // Create CSV content with title
      const title = activeTab === 'farmers' ? 'COMMODITY PROFILE - ABACA FARMERS' :
        activeTab === 'buyers' ? 'BUYERS LIST' : 'ASSOCIATION COORDINATORS LIST';
      const csvContent = [
        title,
        `Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeTab}_commodity_profile_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    if (filteredUsers.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Fetch detailed data for all users using API client
      const detailedUsers = await Promise.all(
        filteredUsers.map(async (user) => {
          let endpoint = '';
          if (activeTab === 'farmers') {
            endpoint = `/api/mao/farmers/${user.id}`;
          } else if (activeTab === 'buyers') {
            endpoint = `/api/mao/buyers/${user.id}`;
          } else if (activeTab === 'associations') {
            endpoint = `/api/mao/associations/${user.id}`;
          }

          const response = await apiGet(endpoint);
          return response.json();
        })
      );

      // Create PDF using jsPDF
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const title = activeTab === 'farmers' ? 'COMMODITY PROFILE' :
        activeTab === 'buyers' ? 'BUYERS LIST' : 'ASSOCIATION COORDINATORS LIST';
      const subtitle = activeTab === 'farmers' ? 'ABACA' : '';

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

      if (subtitle) {
        doc.setFontSize(14);
        doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
      }

      // Add metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, subtitle ? 30 : 25);
      doc.text(`Total Records: ${detailedUsers.length}`, 14, subtitle ? 35 : 30);

      // Prepare table data
      if (activeTab === 'farmers') {
        const tableData = detailedUsers.map((user, index) => [
          index + 1,
          user.farmer_id?.substring(0, 8) || 'N/A',
          user.full_name || 'N/A',
          user.sex || 'N/A',
          user.age || 'N/A',
          user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A',
          user.civil_status || 'N/A',
          user.email || 'N/A',
          user.contact_number || 'N/A',
          user.barangay || 'N/A',
          user.municipality || 'N/A',
          user.association_name || 'N/A',
          user.farm_area_hectares || 'N/A',
          user.type_of_abaca_planted || 'N/A',
          user.selling_price_range_max || 'N/A',
          user.regular_buyer || 'N/A',
          user.income_per_cycle || 'N/A',
          user.verification_status?.toUpperCase() || 'PENDING'
        ]);

        autoTable(doc, {
          startY: subtitle ? 40 : 35,
          head: [[
            'No.', 'Farmer ID', 'Name', 'Sex', 'Age', 'Birthday', 'Civil Status',
            'Email', 'Contact', 'Barangay', 'Municipality', 'Association',
            'Farm Area', 'Abaca Type', 'Price Max', 'Buyer', 'Income', 'Status'
          ]],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [52, 168, 83], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 18 },
            2: { cellWidth: 25 }
          }
        });
      } else if (activeTab === 'buyers') {
        const tableData = detailedUsers.map((user, index) => [
          index + 1,
          user.buyer_id?.substring(0, 8) || 'N/A',
          user.business_name || 'N/A',
          user.owner_name || 'N/A',
          user.email || 'N/A',
          user.contact_number || 'N/A',
          user.business_address || 'N/A',
          user.business_type || 'N/A',
          user.verification_status?.toUpperCase() || 'PENDING',
          user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
        ]);

        autoTable(doc, {
          startY: 35,
          head: [[
            'No.', 'Buyer ID', 'Business Name', 'Owner Name', 'Email',
            'Contact', 'Business Address', 'Business Type', 'Status', 'Date Registered'
          ]],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 20 }
          }
        });
      } else if (activeTab === 'associations') {
        const tableData = detailedUsers.map((user, index) => [
          index + 1,
          user.officer_id?.substring(0, 8) || 'N/A',
          user.full_name || 'N/A',
          user.email || 'N/A',
          user.contact_number || 'N/A',
          user.association_name || 'N/A',
          user.position || 'N/A',
          user.verification_status?.toUpperCase() || 'PENDING',
          user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
        ]);

        autoTable(doc, {
          startY: 35,
          head: [[
            'No.', 'Officer ID', 'Name', 'Email', 'Contact',
            'Organization', 'Position', 'Status', 'Date Registered'
          ]],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [168, 85, 247], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 }
          }
        });
      }

      // Save PDF
      const fileName = `${activeTab}_commodity_profile_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Modern Stats Cards with Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
        {/* Total Card */}
        <div className="group relative bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/60" />
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Total Users</p>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Action Needed
              </span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Pending Review</p>
            <p className="text-4xl font-bold text-white">{stats.pending}</p>
          </div>
        </div>

        {/* Verified Card */}
        <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Active
              </span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Verified</p>
            <p className="text-4xl font-bold text-white">{stats.verified}</p>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="group relative bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Rejected</p>
            <p className="text-4xl font-bold text-white">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Modern Tabs with Glassmorphism */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8">
        <button
          onClick={() => setActiveTab('farmers')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'farmers'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'farmers' ? 'bg-white/20' : 'bg-emerald-50 group-hover:bg-emerald-100'
            }`}>
            <Users className="w-5 h-5" />
          </div>
          <span>Farmers</span>
          {activeTab === 'farmers' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('buyers')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'buyers'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'buyers' ? 'bg-white/20' : 'bg-blue-50 group-hover:bg-blue-100'
            }`}>
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span>Buyers</span>
          {activeTab === 'buyers' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('associations')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'associations'
            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'associations' ? 'bg-white/20' : 'bg-purple-50 group-hover:bg-purple-100'
            }`}>
            <Building2 className="w-5 h-5" />
          </div>
          <span>Association</span>
          {activeTab === 'associations' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
      </div>

      {/* Modern Filters with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, email, organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="verified">✓ Verified</option>
                <option value="rejected">✗ Rejected</option>
                <option value="deactivated">🚫 Deactivated</option>
              </select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold whitespace-nowrap group"
              title="Export to CSV"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              <span className="hidden md:inline">Export CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold whitespace-nowrap group"
              title="Export to PDF"
            >
              <FileText className="w-5 h-5 group-hover:animate-bounce" />
              <span className="hidden md:inline">Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Table with Enhanced Design */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No {activeTab} found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Name
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {activeTab === 'farmers' ? 'Association' : activeTab === 'buyers' ? 'Business' : 'Association'}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Registered
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {user.contactNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {activeTab === 'farmers' ? user.association : activeTab === 'buyers' ? user.businessName : user.association}
                          </div>
                          {activeTab === 'associations' && user.position && (
                            <div className="text-xs text-gray-500">{user.position}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : user.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : user.status === 'deactivated'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {user.status === 'deactivated' ? 'Deactivated' : user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                fetchUserDetails(user.id);
                                setShowViewModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md group-hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleVerify(user.id)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                                  title="Verify"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRejectModal(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={async () => {
                                setSelectedUser(user);
                                setShowEditModal(true);
                                await fetchUserDetails(user.id);
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {user.status === 'verified' && (
                              <button
                                onClick={() => handleDeactivate(user.id)}
                                className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                                title="Deactivate"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                            {user.status === 'deactivated' && (
                              <button
                                onClick={() => handleReactivate(user.id)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                                title="Reactivate"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Items per page */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Show entries:</span>
                  <div className="flex gap-2">
                    {[10, 20, 40].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${itemsPerPage === size
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-emerald-50 border border-gray-200'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page info and navigation */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredUsers.length / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(filteredUsers.length / itemsPerPage)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${currentPage >= Math.ceil(filteredUsers.length / itemsPerPage)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {activeTab === 'farmers' ? 'Farmer' : activeTab === 'buyers' ? 'Buyer' : 'Association Coordinator'} Details
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUserDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading details...</p>
              </div>
            ) : selectedUserDetails ? (
              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-lg border-2 ${!selectedUserDetails.is_active || selectedUserDetails.deactivated_at
                  ? 'bg-orange-50 border-orange-200'
                  : selectedUserDetails.verification_status === 'verified'
                    ? 'bg-emerald-50 border-emerald-200'
                    : selectedUserDetails.verification_status === 'pending'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verification Status</p>
                      <p className={`text-2xl font-bold mt-1 ${!selectedUserDetails.is_active || selectedUserDetails.deactivated_at
                        ? 'text-orange-700'
                        : selectedUserDetails.verification_status === 'verified'
                          ? 'text-emerald-700'
                          : selectedUserDetails.verification_status === 'pending'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}>
                        {(!selectedUserDetails.is_active || selectedUserDetails.deactivated_at)
                          ? 'DEACTIVATED'
                          : selectedUserDetails.verification_status?.toUpperCase() || 'PENDING'}
                      </p>
                    </div>
                    {selectedUserDetails.deactivated_at && (
                      <div className="text-right">
                        <p className="text-sm text-orange-600 font-medium">Deactivated On</p>
                        <p className="text-sm font-bold text-orange-900">
                          {new Date(selectedUserDetails.deactivated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {(selectedUserDetails.verified_at && !selectedUserDetails.deactivated_at) && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Verified On</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedUserDetails.verified_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedUserDetails.rejection_reason && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700 mt-1">{selectedUserDetails.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Photos Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Verification Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Profile Photo */}
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Profile Photo</p>
                      {(selectedUserDetails.profile_photo || selectedUserDetails.profile_picture) ? (
                        <img
                          src={selectedUserDetails.profile_photo || selectedUserDetails.profile_picture}
                          alt="Profile"
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => setFullscreenImage(selectedUserDetails.profile_photo || selectedUserDetails.profile_picture)}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-400 text-sm">No photo uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Valid ID */}
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Valid ID</p>
                      {selectedUserDetails.valid_id_photo ? (
                        <img
                          src={selectedUserDetails.valid_id_photo}
                          alt="Valid ID"
                          className="w-full h-48 object-contain rounded-lg border-2 border-gray-200 bg-gray-50 hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => setFullscreenImage(selectedUserDetails.valid_id_photo)}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-400 text-sm">No ID uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Business Permit (Buyers only) */}
                    {activeTab === 'buyers' && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Business Permit</p>
                        {selectedUserDetails.business_permit_photo ? (
                          <img
                            src={selectedUserDetails.business_permit_photo}
                            alt="Business Permit"
                            className="w-full h-48 object-contain rounded-lg border-2 border-gray-200 bg-gray-50 hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => setFullscreenImage(selectedUserDetails.business_permit_photo)}
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-400 text-sm">No permit uploaded</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {activeTab === 'buyers' ? selectedUserDetails.owner_name : selectedUserDetails.full_name}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p className="font-medium text-gray-900 break-all">{selectedUserDetails.email}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Contact Number
                      </p>
                      <p className="font-medium text-gray-900">{selectedUserDetails.contact_number || 'Not provided'}</p>
                    </div>
                    {activeTab === 'farmers' && (
                      <>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sex</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.sex || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.age || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Birthday
                          </p>
                          <p className="font-medium text-gray-900">
                            {selectedUserDetails.birthday
                              ? new Date(selectedUserDetails.birthday).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                              : 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Civil Status</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.civil_status || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Address
                          </p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.address || 'Not provided'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Farm/Business Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    {activeTab === 'farmers' ? (
                      <><TrendingUp className="w-5 h-5 text-purple-600" /> Farm Information</>
                    ) : (
                      <><Building2 className="w-5 h-5 text-purple-600" /> Business Information</>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTab === 'farmers' ? (
                      <>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Organization Name</p>
                          <p className="font-semibold text-gray-900">{selectedUserDetails.association_name || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Municipality</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.municipality || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Barangay</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.barangay || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm col-span-full">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Farm Location</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.farm_location || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Farm Coordinates</p>
                          <p className="font-medium text-gray-900 text-sm">{selectedUserDetails.farm_coordinates || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Farm Area (hectares)</p>
                          <p className="font-semibold text-gray-900 text-lg">{selectedUserDetails.farm_area_hectares || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Years in Farming</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.years_in_farming || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type of Abaca Planted</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.type_of_abaca_planted || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Average Harvest Volume (kg)</p>
                          <p className="font-semibold text-gray-900">{selectedUserDetails.average_harvest_volume_kg || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Harvest Cycle Duration (Weeks)</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.harvest_frequency_weeks || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Selling Price Range (per kg)</p>
                          <p className="font-medium text-gray-900">
                            {selectedUserDetails.selling_price_range_min && selectedUserDetails.selling_price_range_max
                              ? `₱${selectedUserDetails.selling_price_range_min} - ₱${selectedUserDetails.selling_price_range_max}`
                              : 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Regular Buyer</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.regular_buyer || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Income per Cycle</p>
                          <p className="font-semibold text-gray-900">
                            {selectedUserDetails.income_per_cycle ? `₱${Number(selectedUserDetails.income_per_cycle).toLocaleString()}` : 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm col-span-full">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remarks</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.remarks || 'No remarks'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Business Name</p>
                          <p className="font-semibold text-gray-900">{selectedUserDetails.business_name}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Business Address</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.business_address || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">License/Accreditation</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.license_or_accreditation || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Buying Schedule</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.buying_schedule || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Buying Location</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.buying_location || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Warehouse Address</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.warehouse_address || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price Range</p>
                          <p className="font-medium text-gray-900">
                            {selectedUserDetails.price_range_min && selectedUserDetails.price_range_max
                              ? `₱${selectedUserDetails.price_range_min} - ₱${selectedUserDetails.price_range_max}`
                              : 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Terms</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.payment_terms || 'Not provided'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm col-span-full">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Accepted Quality Grades</p>
                          <p className="font-medium text-gray-900">
                            {selectedUserDetails.accepted_quality_grades?.join(', ') || 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm col-span-full">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remarks</p>
                          <p className="font-medium text-gray-900">{selectedUserDetails.remarks || 'No remarks'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    System Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Account Created</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedUserDetails.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {selectedUserDetails.updated_at
                          ? new Date(selectedUserDetails.updated_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Login</p>
                      <p className="font-medium text-gray-900">
                        {selectedUserDetails.last_login
                          ? new Date(selectedUserDetails.last_login).toLocaleString()
                          : 'Never logged in'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedUserDetails.verification_status === 'pending' && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedUser(selectedUser);
                        setShowRejectModal(true);
                      }}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Application
                    </button>
                    <button
                      onClick={() => {
                        handleVerify(selectedUser!.id);
                        setShowViewModal(false);
                      }}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Verify & Approve
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-600">No details available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                Edit {activeTab === 'farmers' ? 'Farmer' : 'Buyer'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : editFormData && Object.keys(editFormData).length > 0 ? (
              <div className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {activeTab === 'buyers' ? 'Owner Name' : 'Full Name'} *
                        </label>
                        <input
                          type="text"
                          value={activeTab === 'buyers' ? (editFormData.owner_name || '') : (editFormData.full_name || '')}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            [activeTab === 'buyers' ? 'owner_name' : 'full_name']: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <input
                          type="tel"
                          value={editFormData.contact_number || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {activeTab === 'farmers' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                            <select
                              value={editFormData.sex || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, sex: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                            <input
                              type="number"
                              value={editFormData.age || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                            <input
                              type="date"
                              value={editFormData.birthday || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, birthday: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                            <select
                              value={editFormData.civil_status || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, civil_status: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Widowed">Widowed</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Separated">Separated</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                              type="text"
                              value={editFormData.address || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Farm & Sales Information */}
                  {activeTab === 'farmers' ? (
                    <div className="space-y-6">
                      {/* Location & Association */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-orange-600" /> Location & Association
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                            <input
                              type="text"
                              value={editFormData.association_name || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, association_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                            <input
                              type="text"
                              value={editFormData.municipality || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, municipality: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                            <input
                              type="text"
                              value={editFormData.barangay || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, barangay: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Location (Specific Address)</label>
                            <input
                              type="text"
                              value={editFormData.farm_location || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, farm_location: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Coordinates</label>
                            <input
                              type="text"
                              value={editFormData.farm_coordinates || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, farm_coordinates: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Latitude, Longitude"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Farm Details */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" /> Farm Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Area (hectares)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.farm_area_hectares || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, farm_area_hectares: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Years in Farming</label>
                            <input
                              type="number"
                              value={editFormData.years_in_farming || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, years_in_farming: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type of Abaca Planted</label>
                            <input
                              type="text"
                              value={editFormData.type_of_abaca_planted || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, type_of_abaca_planted: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sales & Productivity */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Coins className="w-5 h-5 text-emerald-600" /> Sales & Productivity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Average Harvest (kg)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.average_harvest_volume_kg || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, average_harvest_volume_kg: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Cycle Duration (Weeks)</label>
                            <input
                              type="number"
                              value={editFormData.harvest_frequency_weeks || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, harvest_frequency_weeks: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Selling Price (₱/kg)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.selling_price_range_min || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, selling_price_range_min: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Selling Price (₱/kg)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.selling_price_range_max || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, selling_price_range_max: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Regular Buyer</label>
                            <input
                              type="text"
                              value={editFormData.regular_buyer || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, regular_buyer: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Income per Cycle (₱)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.income_per_cycle || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, income_per_cycle: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Remarks</label>
                        <textarea
                          value={editFormData.remarks || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="General observations or monitoring notes..."
                        />
                      </div>
                    </div>
                  ) : activeTab === 'buyers' ? (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-600" /> Business Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                          <input
                            type="text"
                            value={editFormData.business_name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                          <input
                            type="text"
                            value={editFormData.business_address || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, business_address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">License/Accreditation</label>
                          <input
                            type="text"
                            value={editFormData.license_or_accreditation || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, license_or_accreditation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Buying Schedule</label>
                          <input
                            type="text"
                            value={editFormData.buying_schedule || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, buying_schedule: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-600" /> Member Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                          <input
                            type="text"
                            value={editFormData.association_name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, association_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                          <input
                            type="text"
                            value={editFormData.position || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditFormData({});
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {
        showRejectModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  Reject Application
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Please provide a reason for rejecting this {activeTab === 'farmers' ? 'farmer' : 'buyer'} application.
                  This will be sent to the applicant.
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Applicant</p>
                  <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Incomplete documents, Invalid ID, Business permit expired..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific and professional. This helps the applicant understand what needs to be corrected.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Fullscreen Image Modal */}
      {
        fullscreenImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-all"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <div className="max-w-7xl max-h-full flex items-center justify-center">
              <img
                src={fullscreenImage}
                alt="Fullscreen view"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <p className="absolute bottom-4 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
              Click anywhere to close
            </p>
          </div>
        )
      }
    </div >
  );
};

export default UserManagement;
