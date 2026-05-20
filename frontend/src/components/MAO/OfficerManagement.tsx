import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Trash2, Shield, User as UserIcon, UserPlus, Eye, Lock, X, Mail, Phone, MapPin, Calendar, Briefcase, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import CreateOfficerModal from './CreateOfficerModal';

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

      const response = await fetch('https://server.easyabaca.site/api/mao/officers', {
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
      const response = await fetch(`https://server.easyabaca.site/api/mao/officers/${selectedOfficer.officer_id}`, {
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
      const verifyResponse = await fetch('https://server.easyabaca.site/api/auth/login', {
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
      const response = await fetch(`https://server.easyabaca.site/api/mao/officers/${selectedOfficer.officer_id}`, {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-8">
      {/* Action Button moved to search area */}

      {/* Modern Stats Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/60" />
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Staff</p>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">Admin</span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Administrators</p>
            <p className="text-4xl font-bold text-white">{stats.admins}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">Active</span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Profile Completed</p>
            <p className="text-4xl font-bold text-white">{stats.completed}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Edit className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Pending Profile</p>
            <p className="text-4xl font-bold text-white">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Modern Search Bar & Action Button */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            Create Coordinator
          </button>
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
            <p className="mt-4 text-gray-600 font-medium">Loading staff...</p>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No staff found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinator
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Office
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOfficers.map((officer) => (
                  <tr key={officer.officer_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {officer.profile_picture ? (
                          <img
                            src={officer.profile_picture}
                            alt={officer.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-600 font-semibold text-sm">
                              {officer.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{officer.full_name}</div>
                          {officer.position === 'Administrator' && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                              <span>🛡️</span>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${officer.profile_completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        {officer.profile_completed ? 'Complete' : 'Pending Profile'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(officer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(officer)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Coordinator"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(officer)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Coordinator"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedOfficer.profile_picture ? (
                    <img
                      src={selectedOfficer.profile_picture}
                      alt={selectedOfficer.full_name}
                      className="w-16 h-16 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                      <span className="text-emerald-600 font-bold text-2xl">
                        {selectedOfficer.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedOfficer.full_name}</h2>
                    <p className="text-emerald-100">{selectedOfficer.position || 'Coordinator'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-emerald-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-800">{selectedOfficer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="text-sm font-medium text-gray-800">{selectedOfficer.contact_number || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-800">{selectedOfficer.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Position Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Office Name</p>
                    <p className="text-sm font-medium text-gray-800">{selectedOfficer.office_name || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Assigned Municipality</p>
                    <p className="text-sm font-medium text-gray-800">{selectedOfficer.assigned_municipality || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <p className="text-xs text-gray-500">Assigned Barangay Coverage</p>
                    <p className="text-sm font-medium text-gray-800">{selectedOfficer.assigned_barangay || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Account Status
                </h3>
                <div className="flex flex-wrap gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${selectedOfficer.profile_completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {selectedOfficer.profile_completed ? '✓ Profile Complete' : '○ Profile Pending'}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${selectedOfficer.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {selectedOfficer.is_active ? '✓ Active' : '○ Inactive'}
                  </span>
                  {selectedOfficer.is_super_admin && (
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                      ⭐ Super Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(selectedOfficer.created_at).toLocaleString()}</span>
                  </div>
                  {selectedOfficer.last_login && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Last Login: {new Date(selectedOfficer.last_login).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedOfficer);
                }}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Edit className="w-6 h-6" />
                  Edit Coordinator
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <input
                  type="text"
                  value={editFormData.position || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Office Name</label>
                <input
                  type="text"
                  value={editFormData.office_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, office_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="e.g., Municipal Agriculture Office, Talacogon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Municipality</label>
                <input
                  type="text"
                  value={editFormData.assigned_municipality || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, assigned_municipality: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="e.g., Talacogon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Barangay Coverage</label>
                <input
                  type="text"
                  value={editFormData.assigned_barangay || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, assigned_barangay: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="e.g., Barangay Poblacion, San Isidro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <input
                  type="text"
                  value={editFormData.contact_number || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  Confirm Deletion
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">This action cannot be undone!</p>
                  <p className="text-sm text-red-700 mt-1">
                    You are about to delete <strong>{selectedOfficer.full_name}</strong>.
                  </p>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  placeholder="Enter your password"
                  disabled={deleteLoading}
                />
                {deleteError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {deleteError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading || !deletePassword.trim()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
