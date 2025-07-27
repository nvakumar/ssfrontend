// src/pages/CastingCallsPage.tsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header.tsx';
import LeftSidebar from '../components/LeftSidebar.tsx';
import CastingCallCard from '../components/CastingCallCard.tsx'; // 👈 Updated import path
import CreateCastingCallModal from '../components/CreateCastingCallModal.tsx'; // 👈 Updated import path

// Define the shape of the Casting Call data we expect from the API
interface CastingCallUser {
  _id: string;
  fullName: string;
  role: string;
}
interface CastingCall {
  _id: string;
  user: CastingCallUser;
  projectTitle: string;
  projectType: string;
  roleDescription: string;
  roleType: string;
  location: string;
  applicationDeadline: string;
  contactEmail: string;
}

const CastingCallsPage = () => {
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // 👈 State to control modal visibility
  const { token } = useAuth();

  const fetchCastingCalls = async () => {
    if (!token) return;
    try {
      // Set loading to true only for the initial fetch
      if (castingCalls.length === 0) setIsLoading(true);
      const response = await api.get('/api/casting-calls', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCastingCalls(response.data);
    } catch (error) {
      console.error("Failed to fetch casting calls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCastingCalls();
  }, [token]);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Header />
      <main className="pt-16 container mx-auto px-4">
        <div className="flex">
          <LeftSidebar />
          <div className="flex-grow p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Casting Calls</h1>
              {/* 👇 This button now opens the modal */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Post a Casting Call
              </button>
            </div>
            
            {isLoading ? (
              <p>Loading casting calls...</p>
            ) : (
              <div className="space-y-6">
                {castingCalls.length > 0 ? (
                  castingCalls.map(call => (
                    <CastingCallCard key={call._id} call={call} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">No active casting calls at the moment.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 👇 Conditionally render the modal */}
      {isModalOpen && (
        <CreateCastingCallModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchCastingCalls} // Pass the fetch function to refresh the list
        />
      )}
    </div>
  );
};

export default CastingCallsPage;
