import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Trash2, Shield, User as UserIcon, UserPlus, Eye, Lock, X, Mail, Phone, MapPin, Calendar, Briefcase, Clock } from 'lucide-react';
import CreateOfficerModal from './CreateOfficerModal';
import { KpiStrip, EditorialCard, StatusPill, EditorialCallout } from '../Shared/EditorialUI';

interface Officer {
  officer_id: string;
  full_name: string;
  email: string;
  position: string;
  office_name?: string;
  assigned_municipality?: string;
  assigned_barangay?: string;
  contact_number: string;
  address?: string;
  profile_picture?: string;
  is_active: boolean;
  is_super_admin?: boolean;
  profile_completed: boolean;
  verification_status?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

const OfficerManagement: React.FC = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Officer>>({});

  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = officers.filter(officer =>
        officer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (officer.position && officer.position.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOfficers(filtered);
    } else {
      setFilteredOfficers(officers);
    }
  }, [officers, searchTerm]);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.error('❌ No access token found. Please login again.');
        alert('Session expired. Please login again.');
        setOfficers([]);
        return;
      }

      console.log('🔑 Fetching officers with token:', token.substring(0, 20) + '...');

      const response = await fetch('https://fibersupplychain.onrender.com/api/mao/officers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch officers:', response.status, errorData);

        if (response.status === 401) {
          alert('⚠️ Authentication failed. Please logout and login again.');
        }

        setOfficers([]); // Set empty array on error
        return;
      }

      const data = await response.json();
      console.log('✅ Officers data received:', data); // Debug log

      // Ensure data is an array
      if (Array.isArray(data)) {
        setOfficers(data);
        console.log(`✅ Loaded ${data.length} officers`);
      } else {
        console.error('❌ Data is not an array:', data);
        setOfficers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching officers:', error);
      setOfficers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (officer: Officer) => {
    setSelectedOfficer(officer);
    setShowViewModal(true);
  };

  const handleEditClick = (officer: Officer) => {
    setSelectedOfficer(officer);
    setEditFormData({
      full_name: officer.full_name,
      position: officer.position,
      office_name: officer.office_name,
      assigned_municipality: officer.assigned_municipality,
      assigned_barangay: officer.assigned_barangay,
      contact_number: officer.contact_number,
      address: officer.address,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedOfficer) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fibersupplychain.onrender.com/api/mao/officers/${selectedOfficer.officer_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        alert('✅ Coordinator updated successfully!');
        setShowEditModal(false);
        fetchOfficers();
      } else {
        const data = await response.json();
        alert(`❌ Failed to update coordinator: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating coordinator:', error);
      alert('❌ Failed to update coordinator');
    }
  };

  const handleDeleteClick = (officer: Officer) => {
    setSelectedOfficer(officer);
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOfficer) return;
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      // Verify password by attempting login
      const verifyResponse = await fetch('https://fibersupplychain.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser?.email,
          password: deletePassword,
          userType: 'coordinator',
        }),
      });

      if (!verifyResponse.ok) {
        setDeleteError('Incorrect password. Please try again.');
        setDeleteLoading(false);
        return;
      }

      // Password verified, proceed with deletion
      const response = await fetch(`https://fibersupplychain.onrender.com/api/mao/officers/${selectedOfficer.officer_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Coordinator deleted successfully!');
        setShowDeleteModal(false);
        fetchOfficers();
      } else {
        const data = await response.json();
        setDeleteError(data.error || 'Failed to delete coordinator');
      }
    } catch (error) {
      console.error('Error deleting coordinator:', error);
      setDeleteError('Failed to delete coordinator. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const stats = {
    total: officers.length,
    admins: officers.filter(o => o.position === 'Administrator').length,
    completed: officers.filter(o => o.profile_completed).length,
    pending: officers.filter(o => !o.profile_completed).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={4}
        items={[
          { label: 'Total Staff', value: stats.total, subtext: 'Registered coordinators' },
          { label: 'Administrators', value: stats.admins, accentSubtext: 'Admin access' },
          { label: 'Profile Completed', value: stats.completed, subtext: 'Active profiles' },
          { label: 'Pending Profile', value: stats.pending, subtext: 'Awaiting completion' },
        ]}
      />

      {/* Search Bar & Action Button */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] transition-colors placeholder:text-gray-400 text-sm text-gray-900"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Create Coordinator
          </button>
        </div>
      </div>

      {/* Coordinators Table */}
      <EditorialCard noPadding>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#047857] border-t-transparent animate-spin"></div>
            <p className="mt-3 text-sm text-gray-500 font-medium">Loading staff...</p>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-serif text-lg font-bold text-gray-900">No staff found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Coordinators directory table">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Coordinator
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Office
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredOfficers.map((officer) => (
                  <tr key={officer.officer_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {officer.profile_picture ? (
                          <img
                            src={officer.profile_picture}
                            alt={officer.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#EAF6F0] border border-[#CBEAD9] flex items-center justify-center">
                            <span className="text-[#047857] font-semibold text-xs">
                              {officer.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{officer.full_name}</div>
                          {officer.position === 'Administrator' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#92400E]">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {officer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {officer.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {officer.office_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusPill tone={officer.profile_completed ? 'success' : 'info'}>
                        {officer.profile_completed ? 'Complete' : 'Pending Profile'}
                      </StatusPill>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(officer)}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          title="View Details"
                          aria-label={`View ${officer.full_name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(officer)}
                          className="p-2 text-gray-500 hover:text-[#047857] hover:bg-[#EAF6F0] rounded-xl transition-colors"
                          title="Edit Coordinator"
                          aria-label={`Edit ${officer.full_name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(officer)}
                          className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete Coordinator"
                          aria-label={`Delete ${officer.full_name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EditorialCard>

      {/* Create Coordinator Modal */}
      {showCreateModal && (
        <CreateOfficerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOfficers();
          }}
        />
      )}

      {/* View Details Modal */}
      {showViewModal && selectedOfficer && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedOfficer.profile_picture ? (
                  <img
                    src={selectedOfficer.profile_picture}
                    alt={selectedOfficer.full_name}
                    className="w-12 h-12 rounded-full border border-gray-200 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#EAF6F0] border border-[#CBEAD9] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#047857] font-bold text-lg">
                      {selectedOfficer.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-serif text-xl font-bold text-gray-900 truncate">{selectedOfficer.full_name}</h2>
                  <p className="text-sm text-gray-500 truncate">{selectedOfficer.position || 'Coordinator'}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close details modal"
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#047857]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedOfficer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="text-sm font-medium text-gray-900 tabular-nums">{selectedOfficer.contact_number || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl md:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{selectedOfficer.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Info */}
              <div>
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#047857]" />
                  Position Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-500">Office Name</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOfficer.office_name || 'N/A'}</p>
                  </div>
                  <div className="p-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-500">Assigned Municipality</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOfficer.assigned_municipality || 'N/A'}</p>
                  </div>
                  <div className="p-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl md:col-span-2">
                    <p className="text-xs text-gray-500">Assigned Barangay Coverage</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOfficer.assigned_barangay || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#047857]" />
                  Account Status
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  <StatusPill tone={selectedOfficer.profile_completed ? 'success' : 'info'}>
                    {selectedOfficer.profile_completed ? 'Profile Complete' : 'Profile Pending'}
                  </StatusPill>
                  <StatusPill tone={selectedOfficer.is_active ? 'success' : 'danger'}>
                    {selectedOfficer.is_active ? 'Active' : 'Inactive'}
                  </StatusPill>
                  {selectedOfficer.is_super_admin && (
                    <StatusPill tone="warning">Super Admin</StatusPill>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500 tabular-nums">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Created: {new Date(selectedOfficer.created_at).toLocaleString()}</span>
                  </div>
                  {selectedOfficer.last_login && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Last Login: {new Date(selectedOfficer.last_login).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedOfficer);
                }}
                className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold inline-flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Coordinator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOfficer && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#047857]" />
                Edit Coordinator
              </h2>
              <button
                type="button"
                aria-label="Close edit modal"
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
                <input
                  type="text"
                  value={editFormData.position || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Office Name</label>
                <input
                  type="text"
                  value={editFormData.office_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, office_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                  placeholder="e.g., Municipal Agriculture Office, Talacogon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Municipality</label>
                <input
                  type="text"
                  value={editFormData.assigned_municipality || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, assigned_municipality: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                  placeholder="e.g., Talacogon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Barangay Coverage</label>
                <input
                  type="text"
                  value={editFormData.assigned_barangay || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, assigned_barangay: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                  placeholder="e.g., Barangay Poblacion, San Isidro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
                <input
                  type="text"
                  value={editFormData.contact_number || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <textarea
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold inline-flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Password */}
      {showDeleteModal && selectedOfficer && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Confirm Deletion
              </h2>
              <button
                type="button"
                aria-label="Close delete modal"
                onClick={() => setShowDeleteModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <EditorialCallout tone="rose" title="This action cannot be undone!">
                You are about to delete <strong>{selectedOfficer.full_name}</strong>.
              </EditorialCallout>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Enter your password"
                  disabled={deleteLoading}
                />
                {deleteError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />
                    {deleteError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading || !deletePassword.trim()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Coordinator</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerManagement;
