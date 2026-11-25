import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  AlertCircle,
  Edit,
  ArrowLeft,
  Shield,
  Tractor,
  X
} from 'lucide-react';
import { EditorialCard, StatusPill } from '../Shared/EditorialUI';

const PhilippinePeso = ({ className, size = 24 }: { className?: string; size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <text
      x="12"
      y="12"
      dy="1"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="20"
      fontWeight="bold"
      fill="currentColor"
    >
      ₱
    </text>
  </svg>
);

interface FarmerProfile {
  farmer_id: string;
  full_name: string;
  email: string;
  sex: string;
  age: number;
  contact_number: string;
  address: string;
  barangay: string;
  municipality: string;
  association_name: string;
  farm_location: string;
  farm_coordinates: string;
  farm_area_hectares: number;
  years_in_farming: number;
  type_of_abaca_planted: string;
  average_harvest_volume_kg: number;
  harvest_frequency_weeks: number;
  selling_price_range_min: number;
  selling_price_range_max: number;
  regular_buyer: string;
  income_per_cycle: number;
  profile_photo: string | null;
  valid_id_photo: string | null;
  is_active: boolean;
  is_verified: boolean;
  verification_status: string;
}

interface FarmerProfileProps {
  onBack: () => void;
  onEditProfile: () => void;
}

const FarmerProfile: React.FC<FarmerProfileProps> = ({ onBack, onEditProfile }) => {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        alert('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
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

        if (response.status === 500) {
          alert('Server error loading profile. Please ensure you\'re logged in as a Farmer.');
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
      <EditorialCard>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#047857] border-t-transparent mb-3" />
          <p className="text-sm text-gray-600 font-medium">Loading profile...</p>
        </div>
      </EditorialCard>
    );
  }

  if (!profile) {
    return (
      <EditorialCard>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Failed to load profile</p>
          </div>
        </div>
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
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Profile Card */}
      <EditorialCard noPadding>
        {/* Profile Header */}
        <div className="bg-white border-b border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            {/* Profile Picture */}
            {profile.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt={profile.full_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#EAF6F0] border border-[#CBEAD9] text-[#047857] flex items-center justify-center text-3xl sm:text-4xl font-bold flex-shrink-0">
                {(profile.full_name || 'F').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {profile.full_name || 'Farmer'}
              </h2>
              <p className="text-sm text-gray-500 mb-3">Abaca Farmer</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {getVerificationBadge()}
                <StatusPill tone={profile.is_active ? 'success' : 'neutral'}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </StatusPill>
              </div>
            </div>

            {/* Edit Button */}
            <button
              type="button"
              onClick={onEditProfile}
              className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm flex items-center gap-2 flex-shrink-0"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Email */}
            <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[#047857]" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</h3>
              </div>
              <p className="text-sm text-gray-900 font-semibold break-all">{profile.email || 'N/A'}</p>
            </div>

            {/* Contact */}
            <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-[#047857]" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</h3>
              </div>
              <p className="text-sm text-gray-900 font-semibold tabular-nums">{profile.contact_number || 'N/A'}</p>
            </div>

            {/* Address */}
            <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#047857]" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</h3>
              </div>
              <p className="text-sm text-gray-900 font-semibold">
                {[profile.address, profile.barangay, profile.municipality].filter(Boolean).join(', ') || 'N/A'}
              </p>
            </div>

            {/* Sex & Age */}
            <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-[#047857]" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sex & Age</h3>
              </div>
              <p className="text-sm text-gray-900 font-semibold">
                {profile.sex || 'N/A'}{profile.age ? `, ${profile.age} years old` : ''}
              </p>
            </div>

            {/* Association */}
            <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200 sm:col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-[#047857]" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Association</h3>
              </div>
              <p className="text-sm text-gray-900 font-semibold">{profile.association_name || 'Independent Farmer'}</p>
            </div>

            {/* Farm Information */}
            <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200 col-span-1 sm:col-span-2 md:col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <Tractor className="w-4 h-4 text-[#047857]" />
                <h3 className="font-serif text-base font-bold text-gray-900">Farm Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Farm Area</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{profile.farm_area_hectares ?? 0} hectares</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Years Farming</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{profile.years_in_farming ?? 0} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Abaca Type</p>
                  <p className="text-sm font-bold text-gray-900">{profile.type_of_abaca_planted || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Average Harvest</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{profile.average_harvest_volume_kg ?? 0} kg</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-0.5">Farm Location</p>
                <p className="text-sm font-semibold text-gray-900">{profile.farm_location || 'N/A'}</p>
              </div>
            </div>

            {/* Sales Information */}
            <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200 col-span-1 sm:col-span-2 md:col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <PhilippinePeso className="w-4 h-4 text-[#E59500]" />
                <h3 className="font-serif text-base font-bold text-gray-900">Sales Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Price Range</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    ₱{profile.selling_price_range_min ?? 0} - ₱{profile.selling_price_range_max ?? 0}/kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Harvest Frequency</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{profile.harvest_frequency_weeks ?? 0} weeks</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Regular Buyer</p>
                  <p className="text-sm font-bold text-gray-900">{profile.regular_buyer || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Income per Cycle</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    ₱{Number(profile.income_per_cycle || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Valid ID Photo */}
          {profile.valid_id_photo && (
            <div className="mt-6 sm:mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-gray-600" />
                <h3 className="font-serif text-base font-bold text-gray-900">Valid ID</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex justify-center">
                <img
                  src={profile.valid_id_photo}
                  alt="Valid ID"
                  className="max-w-full max-h-72 h-auto rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setIsIdModalOpen(true)}
                />
              </div>
            </div>
          )}
        </div>
      </EditorialCard>

      {isIdModalOpen && profile.valid_id_photo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 p-4"
          onClick={() => setIsIdModalOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors bg-white/10 p-2 rounded-full"
            onClick={() => setIsIdModalOpen(false)}
            aria-label="Close valid ID preview"
          >
            <X size={24} />
          </button>
          <img
            src={profile.valid_id_photo}
            alt="Valid ID Fullscreen"
            className="max-w-full max-h-screen object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default FarmerProfile;
