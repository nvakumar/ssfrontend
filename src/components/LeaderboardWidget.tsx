import React, { useState, useEffect } from 'react'; // Keep React import for useState, useEffect
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, ChevronRight, Loader2 } from 'lucide-react'; // Added Loader2 icon

// Define the shape of a leaderboard entry
interface LeaderboardEntry {
  userId: string;
  fullName: string;
  role: string;
  avatar?: string;
  totalLikes: number;
  totalPosts: number;
  engagementScore: number;
}

const allRoles = [
  'All Roles', 'Actor', 'Model', 'Filmmaker', 'Director', 'Writer',
  'Photographer', 'Editor', 'Musician', 'Creator', 'Student', 'Production House'
];

const LeaderboardWidget = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const { token } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!token) {
        setError('Not authenticated to view leaderboard.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const queryParams = selectedRole !== 'All Roles' ? `?role=${encodeURIComponent(selectedRole)}` : '';
        const response = await api.get(`/api/leaderboard${queryParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeaderboard(response.data);
      } catch (err: any) {
        console.error("Failed to fetch leaderboard:", err);
        setError(err.response?.data?.message || "Failed to load leaderboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token, selectedRole]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <Award size={24} className="mr-2 text-yellow-400" /> Top Talent
      </h2>

      {/* Role Filter */}
      <div className="mb-4">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full p-2 text-sm text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {allRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-400 flex items-center justify-center"><Loader2 size={20} className="animate-spin mr-2" /> Loading leaderboard...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <Link 
              to={`/profile/${entry.userId}`} 
              key={entry.userId} 
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold text-lg text-indigo-400 w-6 text-center">{index + 1}.</span>
                <img 
                  src={entry.avatar || `https://placehold.co/50x50/1a202c/ffffff?text=${entry.fullName.charAt(0)}`} 
                  alt={entry.fullName} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-700" 
                />
                <div>
                  <p className="font-semibold text-white">{entry.fullName}</p>
                  <p className="text-sm text-gray-400">{entry.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">{entry.engagementScore.toFixed(0)} pts</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No entries on the leaderboard yet. Post some work!</p>
      )}
    </div>
  );
};

export default LeaderboardWidget;
