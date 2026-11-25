import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  AlertCircle,
  Edit,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface AssociationOfficer {
  officer_id: string;
  full_name: string;
  email: string;
  position: string;
  association_name: string;
  contact_number: string;
  address: string;
  profile_picture: string | null;
  valid_id_photo: string | null;
  term_start_date: string;
  term_end_date: string;
  term_duration: string;
  farmers_under_supervision: number;
  is_active: boolean;
  is_verified: boolean;
  verification_status: string;
}

interface AssociationProfileProps {
  onBack: () => void;
  onEditProfile: () => void;
}

const AssociationProfile: React.FC<AssociationProfileProps> = ({ onBack, onEditProfile }) => {
  const [profile, setProfile] = useState<AssociationOfficer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userType = localStorage.getItem('userType');
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/association/profile`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile || data);
      } else {
        const errorText = await response.text();
        console.error('❌ Profile API Error:', response.status, errorText);
        
        // If 500 error, likely backend issue with token/user lookup
        if (response.status === 500) {
          alert(`Server error loading profile. Please ensure you're logged in as an Association Officer. Type: ${userType}`);
        } else if (response.status === 401 || response.status === 403) {
          alert('Authentication failed. Please log in again.');
        } else {
          alert(`Failed to load profile: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('❌ Network error fetching profile:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#047857]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <EditorialCard className="py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">Failed to load profile</p>
      </EditorialCard>
    );
  }

  const getVerificationBadge = () => {
    if (profile.is_verified) {
      return <StatusPill tone="success">Verified</StatusPill>;
    }
    return <StatusPill tone="warning">{profile.verification_status || 'Pending'}</StatusPill>;
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Profile Header & Details */}
      <EditorialCard noPadding>
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.full_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="font-serif text-2xl font-bold text-gray-900 truncate">
                {profile.full_name}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 mb-3">{profile.position}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {getVerificationBadge()}
                <StatusPill tone={profile.is_active ? 'success' : 'neutral'}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </StatusPill>
              </div>
            </div>

            <button
              type="button"
              onClick={onEditProfile}
              className="px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-xs sm:text-sm inline-flex items-center gap-2 flex-shrink-0"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold break-all">{profile.email}</p>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Contact</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold tabular-nums">{profile.contact_number}</p>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Address</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold">{profile.address}</p>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Association</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold">{profile.association_name}</p>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Briefcase className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Position</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold">{profile.position}</p>
            </div>
          </div>

          {profile.valid_id_photo && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-gray-600" />
                <h3 className="font-serif text-base font-bold text-gray-900">Valid ID</h3>
              </div>
              <div className="bg-[#F8F9FA] rounded-xl p-4 border border-gray-200 inline-block">
                <img
                  src={profile.valid_id_photo}
                  alt="Valid ID"
                  className="max-w-full max-h-72 h-auto rounded-lg border border-gray-200"
                />
              </div>
            </div>
          )}
        </div>
      </EditorialCard>
    </div>
  );
};

export default AssociationProfile;
