// src/pages/GroupsPage.tsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal'; // Import the new modal component

// Define the shape of the Group data we expect from the API
interface GroupAdmin {
  _id: string;
  fullName: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  members: string[]; // Array of user IDs
  admin: GroupAdmin;
  coverImage: string;
}

const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control the modal
  const { token } = useAuth();

  const fetchGroups = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await api.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [token]);

  return (
    <>
      <div className="bg-gray-900 min-h-screen text-white">
        <Header />
        <main className="pt-16 container mx-auto px-4">
          <div className="flex">
            <LeftSidebar />
            <div className="flex-grow p-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Discover Groups</h1>
                <button 
                  onClick={() => setIsModalOpen(true)} // Open the modal on click
                  className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  + Create Group
                </button>
              </div>
              
              {isLoading ? (
                <p>Loading groups...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.length > 0 ? (
                    groups.map(group => (
                      <div key={group._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                          <img src={group.coverImage} alt={`${group.name} cover`} className="w-full h-32 object-cover" />
                          <div className="p-4">
                              <h2 className="text-xl font-bold text-white truncate">{group.name}</h2>
                              <p className="text-gray-400 text-sm mt-1 h-10 overflow-hidden">{group.description}</p>
                              <p className="text-xs text-gray-500 mt-2">{group.members.length} members</p>
                              <Link to={`/groups/${group._id}`} className="mt-4 inline-block w-full text-center py-2 font-semibold bg-gray-700 hover:bg-gray-600 rounded-md">
                                  View Group
                              </Link>
                          </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg">
                      <p className="text-gray-400">No public groups found. Why not create one?</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Conditionally render the modal */}
      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            fetchGroups(); // Refetch groups to show the new one
          }} 
        />
      )}
    </>
  );
};

export default GroupsPage;
