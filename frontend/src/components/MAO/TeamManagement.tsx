import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  User,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';
import { EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface TeamMember {
  member_id: string;
  full_name: string;
  position: string;
  photo_url?: string;
  bio?: string;
  email?: string;
  phone?: string;
  display_order: number;
  is_active: boolean;
}

const TeamManagement: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    photo_url: '',
    bio: '',
    email: '',
    phone: '',
    display_order: 0
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await fetch('https://fibersupplychain.onrender.com/api/team');
      const data = await response.json();
      setTeam(data.team || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      alert('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        full_name: member.full_name,
        position: member.position,
        photo_url: member.photo_url || '',
        bio: member.bio || '',
        email: member.email || '',
        phone: member.phone || '',
        display_order: member.display_order
      });
    } else {
      setEditingMember(null);
      setFormData({
        full_name: '',
        position: '',
        photo_url: '',
        bio: '',
        email: '',
        phone: '',
        display_order: team.length
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, photo_url: reader.result as string });
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.position) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const url = editingMember
        ? `https://fibersupplychain.onrender.com/api/team/${editingMember.member_id}`
        : 'https://fibersupplychain.onrender.com/api/team';
      
      const method = editingMember ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editingMember ? 'Team member updated successfully!' : 'Team member added successfully!');
        handleCloseModal();
        fetchTeam();
      } else {
        const error = await response.json();
        alert('Failed to save team member: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fibersupplychain.onrender.com/api/team/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Team member deleted successfully!');
        fetchTeam();
      } else {
        const error = await response.json();
        alert('Failed to delete team member: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Failed to delete team member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#047857] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EditorialCard
        title="Team Management"
        subtitle="Manage MAO Culiram team members"
        badge={team.length}
        actions={
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        }
      >
        {/* Team List */}
        {team.length === 0 ? (
          <div className="text-center py-14 bg-[#F8F9FA] rounded-2xl border border-dashed border-gray-300">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-gray-900 mb-1">No team members yet</p>
            <p className="text-sm text-gray-500 mb-5">Add agricultural officers and staff to display on the public portal.</p>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
            >
              Add First Team Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {team.map((member) => (
              <div
                key={member.member_id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col"
              >
                {/* Photo */}
                <div className="relative h-52 bg-[#F8F9FA] border-b border-gray-100 overflow-hidden">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  {/* Active Badge */}
                  {!member.is_active && (
                    <div className="absolute top-3 right-3">
                      <StatusPill tone="danger">Inactive</StatusPill>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Name & Position */}
                    <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">
                      {member.full_name}
                    </h3>
                    <p className="text-[#047857] text-sm font-medium mb-3 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span>{member.position}</span>
                    </p>

                    {/* Bio */}
                    {member.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {member.bio}
                      </p>
                    )}

                    {/* Contact Info */}
                    {(member.email || member.phone) && (
                      <div className="space-y-1.5 mb-4 pt-3 border-t border-gray-100">
                        {member.email && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center text-xs text-gray-600 tabular-nums">
                            <Phone className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display Order */}
                    <p className="text-xs text-gray-500 mb-4 tabular-nums">
                      Display Order: {member.display_order}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(member)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member.member_id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-colors text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorialCard>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-200 z-10 flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-gray-900">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button
                type="button"
                aria-label="Close team member modal"
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Photo
                  </label>
                  <div className="flex items-start gap-4">
                    {formData.photo_url ? (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                        <img
                          src={formData.photo_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photo_url: '' })}
                          className="absolute top-1 right-1 p-1 bg-white border border-gray-200 text-red-600 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-xl border border-dashed border-gray-300 flex items-center justify-center bg-[#F8F9FA] flex-shrink-0">
                        <User className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                        disabled={uploadingPhoto}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Max size: 5MB. Formats: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                    placeholder="e.g. Municipal Agriculture Officer"
                    required
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                    placeholder="Brief description about the team member"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm tabular-nums"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm tabular-nums"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
