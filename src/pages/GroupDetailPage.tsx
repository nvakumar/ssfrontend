// src/pages/GroupDetailPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import GroupAdminModal from '../components/GroupAdminModal';
import { LogOut, UserPlus, Camera, Settings } from 'lucide-react';

// Define the shape of the Post data
interface Post {
  _id: string;
  user: { _id: string; fullName: string; role: string; avatar?: string };
  title: string;
  mediaUrl?: string;
  mediaType?: 'Photo' | 'Video';
  likes: string[];
  comments: any[];
  reactions: any[];
}

// Define the shape of the detailed Group data
interface GroupMember {
  _id: string;
  fullName: string;
  avatar?: string;
  role: string;
}

interface GroupDetails {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  admin: {
    _id: string;
    fullName: string;
  };
  members: GroupMember[];
}

const GroupDetailPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState<boolean | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchGroupData = useCallback(async () => {
    if (!groupId || !token) return;
    try {
      const [groupRes, postsRes] = await Promise.all([
        api.get(`/api/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/api/groups/${groupId}/posts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setGroup(groupRes.data);
      setPosts(postsRes.data);

      if (user && groupRes.data.members.some((member: GroupMember) => member._id === user._id)) {
        setIsMember(true);
      } else {
        setIsMember(false);
      }
    } catch (error) {
      console.error("Failed to fetch group data:", error);
      navigate('/feed'); // Navigate away if group doesn't exist or error occurs
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token, user, navigate]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleJoinLeave = async () => {
    if (!groupId || !token) return;
    setIsProcessing(true);
    const endpoint = isMember ? `/api/groups/${groupId}/leave` : `/api/groups/${groupId}/join`;
    try {
      await api.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchGroupData();
    } catch (error) {
      console.error(`Failed to ${isMember ? 'leave' : 'join'} group:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && groupId) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('coverImage', file);
      setIsUploadingCover(true);
      try {
        const response = await api.put(`/api/groups/${groupId}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setGroup(response.data);
      } catch (error) {
        console.error("Failed to upload cover image:", error);
        alert("Failed to upload cover image.");
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const isAdmin = user && group && user._id === group.admin._id;

  if (isLoading) return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Loading group...</div>;
  if (!group) return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Group not found.</div>;

  return (
    <>
      <div className="bg-gray-900 min-h-screen text-white">
        <Header />
        <div className="h-64 md:h-80 relative">
          <img src={group.coverImage} alt={`${group.name} cover`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white">{group.name}</h1>
            <p className="text-lg text-gray-300 mt-2">{group.description}</p>
          </div>
          {isAdmin && (
            <div className="absolute top-4 right-4 space-x-2">
              <input type="file" ref={fileInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingCover} className="bg-black/50 text-white py-2 px-4 rounded-lg flex items-center hover:bg-black/75 transition-colors">
                <Camera size={18} className="mr-2" />
                {isUploadingCover ? 'Uploading...' : 'Change Cover'}
              </button>
              <button onClick={() => setIsAdminModalOpen(true)} className="bg-black/50 text-white py-2 px-4 rounded-lg flex items-center hover:bg-black/75 transition-colors">
                <Settings size={18} className="mr-2" /> Manage
              </button>
            </div>
          )}
        </div>

        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow">
              {isMember && <CreatePost onPostCreated={fetchGroupData} groupId={groupId} />}
              <div className="space-y-6">
                {posts.map(post => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    groupAdminId={group.admin._id} 
                  />
                ))}
              </div>
            </div>
            <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 space-y-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <button onClick={handleJoinLeave} disabled={isProcessing || isAdmin} className={`w-full flex items-center justify-center py-2 px-4 font-bold rounded-md transition-colors ${isAdmin ? 'bg-gray-600 cursor-not-allowed' : isMember ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:bg-gray-500`}>
                  {isAdmin ? 'You are the Admin' : (isMember ? <><LogOut size={18} className="mr-2" /> Leave Group</> : <><UserPlus size={18} className="mr-2" /> Join Group</>)}
                </button>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4">Members ({group.members.length})</h3>
                <ul className="space-y-3">
                  {group.members.slice(0, 10).map(member => (
                    <li key={member._id}>
                      <Link to={`/profile/${member._id}`} className="flex items-center space-x-3 hover:bg-gray-700/50 p-2 rounded-md">
                        <img src={member.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${member.fullName.charAt(0)}`} alt={member.fullName} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-semibold">{member.fullName}</p>
                          <p className="text-sm text-gray-400">{member.role}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </main>
      </div>
      {isAdminModalOpen && (
        <GroupAdminModal 
          group={group} 
          onClose={() => setIsAdminModalOpen(false)} 
          onGroupUpdate={fetchGroupData}
        />
      )}
    </>
  );
};

export default GroupDetailPage;
