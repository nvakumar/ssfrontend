import React, { useState, useEffect } from 'react'; // Keep React import
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal'; // Import the new modal component
import { Loader2, XCircle } from 'lucide-react'; // Added Loader2, XCircle icons

// Define the shape of the Group data we expect from the API
interface GroupAdmin {
  _id: string;
  fullName: string;
  // Add other properties if populated by backend, e.g., avatar?: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  members: string[]; // Array of user IDs (just IDs, not full objects here)
  admin: GroupAdmin; // Admin is an object here, not just an ID
  isPrivate: boolean; // Ensure this is included
  coverImageUrl?: string; // Corrected to coverImageUrl to match backend
}

const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // Added error state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();

  const fetchGroups = async () => {
    if (!token) {
      setError('You must be logged in to view groups.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await api.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (err: any) {
      console.error("Failed to fetch groups:", err);
      setError(err.response?.data?.message || "Failed to load groups. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [token]);

  return (
    <>
      <div className="bg-gray-900 min-h-screen text-white flex flex-col">
        <Header />
        <main className="pt-16 container mx-auto px-4 flex">
          <LeftSidebar />
          <div className="flex-grow p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Discover Groups</h1>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                + Create Group
              </button>
            </div>
            
            {isLoading ? (
              <p className="text-gray-400 flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin mr-2" /> Loading groups...</p>
            ) : error ? (
              <p className="text-red-400 flex items-center justify-center py-10"><XCircle size={16} className="mr-2"/> {error}</p>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => (
                  <div key={group._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                      <img src={group.coverImageUrl || `https://placehold.co/400x200/1f2937/ffffff?text=${group.name.replace(/\s/g, '+')}`} alt={`${group.name} cover`} className="w-full h-32 object-cover" />
                      <div className="p-4">
                          <h2 className="text-xl font-bold text-white truncate">{group.name}</h2>
                          <p className="text-gray-400 text-sm mt-1 h-10 overflow-hidden">{group.description}</p>
                          <p className="text-xs text-gray-500 mt-2">{group.members.length} members</p>
                          <Link to={`/groups/${group._id}`} className="mt-4 inline-block w-full text-center py-2 font-semibold bg-gray-700 hover:bg-gray-600 rounded-md">
                              View Group
                          </Link>
                      </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400">No public groups found. Why not create one?</p>
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Conditionally render the modal */}
      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            fetchGroups(); // Refetch groups to show the new one
            setIsModalOpen(false); // Close modal on success
          }} 
        />
      )}
    </>
  );
};

export default GroupsPage;
