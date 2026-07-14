import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, User } from 'lucide-react';

interface TeamMember {
  member_id: string;
  full_name: string;
  position: string;
  photo_url?: string;
  bio?: string;
  email?: string;
  phone?: string;
}

const TeamSection: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading team...</p>
      </div>
    );
  }

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the MAO Culiram Team
          </p>
          <p className="text-gray-500 mt-2">
            Dedicated professionals working to support our local abaca farmers
          </p>
        </div>

        {/* Team Grid */}
        {team.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No team members available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.member_id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group"
              >
                {/* Photo */}
                <div className="relative h-[538px] bg-gradient-to-br from-gray-50 to-white overflow-hidden flex items-start justify-center pt-4">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-full h-full object-contain object-top scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <User className="w-24 h-24 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {member.full_name}
                  </h3>

                  {member.bio && (
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-center text-emerald-600 text-sm font-medium">
                    <User className="w-4 h-4 mr-2" />
                    {member.position}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSection;
