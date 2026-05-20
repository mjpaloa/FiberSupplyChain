import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  CheckCircle,
  AlertCircle,
  Edit,
  ArrowLeft,
  Shield,
  Tractor,
  X
} from 'lucide-react';

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

      const response = await fetch('https://server.easyabaca.site/api/auth/me', {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load profile</p>
        </div>
      </div>
    );
  }

  const getVerificationBadge = () => {
    if (profile.is_verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-semibold">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs sm:text-sm font-semibold">
        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
        {profile.verification_status || 'Pending'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Profile Picture */}
              {profile.profile_photo ? (
                <img
                  src={profile.profile_photo}
                  alt={profile.full_name}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-white text-emerald-600 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold border-4 border-white shadow-xl">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Basic Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                  {profile.full_name}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100 mb-3">Abaca Farmer</p>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  {getVerificationBadge()}
                  <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={onEditProfile}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all shadow-lg font-semibold text-xs sm:text-sm flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Email */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-5 md:p-6 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Email</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-900 font-semibold break-all">{profile.email}</p>
              </div>

              {/* Contact */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-5 md:p-6 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Contact</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-900 font-semibold">{profile.contact_number}</p>
              </div>

              {/* Address */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-5 md:p-6 rounded-xl border border-purple-200 sm:col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Address</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-900 font-semibold">
                  {profile.address}, {profile.barangay}, {profile.municipality}
                </p>
              </div>

              {/* Sex & Age */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 sm:p-5 md:p-6 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Sex & Age</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-900 font-semibold">{profile.sex}, {profile.age} years old</p>
              </div>

              {/* Association */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-5 md:p-6 rounded-xl border border-orange-200 sm:col-span-2 md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Association</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-900 font-semibold">{profile.association_name}</p>
              </div>

              {/* Farm Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-4 sm:p-5 md:p-6 rounded-xl border border-emerald-200 col-span-1 sm:col-span-2 md:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <Tractor className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Farm Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Farm Area</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{profile.farm_area_hectares} hectares</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Years Farming</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{profile.years_in_farming} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Abaca Type</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{profile.type_of_abaca_planted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Average Harvest</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{profile.average_harvest_volume_kg} kg</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-emerald-200">
                  <p className="text-xs text-gray-600 mb-1">Farm Location</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">{profile.farm_location}</p>
                </div>
              </div>

              {/* Sales Information */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-4 sm:p-5 md:p-6 rounded-xl border border-amber-200 col-span-1 sm:col-span-2 md:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Sales Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Price Range</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">
                      ₱{profile.selling_price_range_min} - ₱{profile.selling_price_range_max}/kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Harvest Frequency</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{profile.harvest_frequency_weeks} weeks</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Regular Buyer</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{profile.regular_buyer || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Income per Cycle</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">₱{profile.income_per_cycle.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Valid ID Photo */}
            {profile.valid_id_photo && (
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-gray-700" />
                  <h3 className="text-sm sm:text-base font-bold text-gray-700 uppercase">Valid ID</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex justify-center">
                  <img
                    src={profile.valid_id_photo}
                    alt="Valid ID"
                    className="max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setIsIdModalOpen(true)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isIdModalOpen && profile.valid_id_photo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsIdModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full"
            onClick={() => setIsIdModalOpen(false)}
          >
            <X size={32} />
          </button>
          <img
            src={profile.valid_id_photo}
            alt="Valid ID Fullscreen"
            className="max-w-full max-h-screen object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default FarmerProfile;
