import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Link } from 'react-router-dom';
=======
import api from '../services/api';
>>>>>>> fa3c2a3 (refactor: remove default React import, use hooks-only imports in all components and pages)
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import CreateGroupModal from '../components/CreateGroupModal';
import { Loader2, XCircle } from 'lucide-react';

interface GroupAdmin {
  _id: string;
  fullName: string;
  // Add other properties here if available (e.g., avatar)
}

interface Group {
  _id: string;
  name: string;
  description: string;
  members: string[];    // just ids
  admin: GroupAdmin;    // full admin object
  isPrivate: boolean;
  coverImageUrl?: string;
}

const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { token } = useAuth();

  const fetchGroups = async () => {
    if (!token) {
      setError('You must be logged in to view groups.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<Group[]>('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch groups:', err);
      if (err instanceof Error) setError(err.message);
      else setError('Failed to load groups. Please try again.');
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
        <main className="container mx-auto px-4 flex pt-16">
          <LeftSidebar />
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-6 px-4">
              <h1 className="text-3xl font-bold">Discover Groups</h1>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                aria-haspopup="dialog"
                aria-expanded={isModalOpen}
                aria-controls="create-group-modal"
                type="button"
              >
                + Create Group
              </button>
            </div>

            {isLoading ? (
              <p
                className="flex items-center justify-center text-gray-400 py-16"
                role="status"
                aria-live="polite"
              >
                <Loader2 size={24} className="animate-spin mr-2" />
                Loading groups...
              </p>
            ) : error ? (
              <p
                className="flex items-center justify-center text-red-500 py-16"
                role="alert"
              >
                <XCircle size={20} className="mr-2" />
                {error}
              </p>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col"
                  >
                    <img
                      src={
                        group.coverImageUrl ||
                        `https://placehold.co/400x200/1f2937/ffffff?text=${encodeURIComponent(
                          group.name.replace(/\s+/g, '+')
                        )}`
                      }
                      alt={`${group.name} cover`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h2
                          className="text-xl font-semibold text-white truncate"
                          title={group.name}
                        >
                          {group.name}
                        </h2>
                        <p
                          className="mt-1 text-gray-400 overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {group.description}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                        </span>
                        <Link
                          to={`/groups/${group._id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                          aria-label={`View details for ${group.name}`}
                        >
                          View Group
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-16 text-center bg-gray-800 rounded-lg">
                <p className="text-gray-400">
                  No public groups found. Why not create one?
                </p>
              </div>
            )}
          </div>
        </main>

        {isModalOpen && (
          <CreateGroupModal
            id="create-group-modal"
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              fetchGroups();
              setIsModalOpen(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default GroupsPage;
