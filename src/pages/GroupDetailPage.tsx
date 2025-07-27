import React, { useState, useEffect, useCallback, useRef } from 'react'; // Keep React import for hooks
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar'; // Corrected import path
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import GroupAdminModal from '../components/GroupAdminModal';
import { LogOut, UserPlus, Camera, Settings, Users, Loader2, Edit, XCircle } from 'lucide-react'; // Added missing icons

// Define the shape of the Post data
interface PostAuthor {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string; // Ensure this is included if backend sends it
}

interface Post {
  _id: string;
  user: PostAuthor;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'Photo' | 'Video';
  likes: string[];
  comments: { _id: string; user: PostAuthor; text: string; createdAt: string; }[];
  reactions: any[];
  group?: { _id: string; admin: string; }; // Ensure group is optional and admin is string ID
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
  coverImageUrl?: string; // Corrected to coverImageUrl to match backend
  admin: string; // Admin is just an ID string
  members: GroupMember[];
  isPrivate: boolean;
}

const GroupDetailPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user: currentUser, token } = useAuth(); // Use currentUser
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState<boolean | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoadingPosts, setIsLoadingPosts] = useState(true); // Moved isLoadingPosts here

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId || !token) return;
    setIsLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await api.get(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedGroup: GroupDetails = response.data;
      setGroup(fetchedGroup);

      if (currentUser && fetchedGroup.members.some((member: GroupMember) => member._id === currentUser._id)) {
        setIsMember(true);
      } else {
        setIsMember(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch group details:", err);
      setError(err.response?.data?.message || "Failed to load group details.");
      // Navigate away only if group doesn't exist or a critical error
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/groups'); // Redirect to main groups page
      }
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token, currentUser, navigate]);


  const fetchGroupPosts = useCallback(async () => {
    if (!groupId || !token) return;
    setIsLoadingPosts(true); // Set loading for posts
    try {
      const response = await api.get(`/api/groups/${groupId}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data as Post[]); // Cast to Post[]
    } catch (err: any) {
      console.error("Failed to fetch group posts:", err);
      if (err.response?.status !== 403) { 
        setError(err.response?.data?.message || "Failed to load group posts.");
      }
      setPosts([]);
    } finally {
      setIsLoadingPosts(false); // Set loading to false
    }
  }, [groupId, token]);


  useEffect(() => {
    fetchGroupDetails();
    fetchGroupPosts(); // Call fetchGroupPosts here
  }, [fetchGroupDetails, fetchGroupPosts]);


  const handleJoinLeave = async () => {
    if (!groupId || !token || !group) return;
    setIsProcessing(true);
    setError('');
    const endpoint = isMember ? `/api/groups/${groupId}/leave` : `/api/groups/${groupId}/join`;
    try {
      await api.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchGroupData();
    } catch (err: any) {
      console.error(`Failed to ${isMember ? 'leave' : 'join'} group:`, err);
      setError(err.response?.data?.message || `Failed to ${isMember ? 'leave' : 'join'} group.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && groupId && group) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('coverImage', file);
      setIsUploadingCover(true);
      setError('');
      try {
        const response = await api.put(`/api/groups/${groupId}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setGroup(response.data);
      } catch (err: any) {
        console.error("Failed to upload cover image:", err);
        setError(err.response?.data?.message || "Failed to upload cover image.");
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  const handleGroupUpdated = (updatedGroup: GroupDetails) => {
    setGroup(updatedGroup);
    if (updatedGroup.isPrivate !== group?.isPrivate) {
      fetchGroupPosts();
    }
  };

  const handleGroupDeleted = (deletedGroupId: string) => {
    console.log(`Group ${deletedGroupId} deleted.`);
    navigate('/groups');
  };


  if (isLoading) return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center"><Loader2 size={32} className="animate-spin mr-2" /> Loading group...</div>;
  
  if (error) return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center"><XCircle size={24} className="mr-2"/> {error}</div>;

  if (!group) return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Group not found.</div>;

  const isAdmin = currentUser && group.admin === currentUser._id;
  const groupCover = group.coverImageUrl || `https://placehold.co/1200x300/1f2937/ffffff?text=${group.name.replace(/\s/g, '+')}`;


  return (
    <>
      <div className="bg-gray-900 min-h-screen text-white">
        <Header />
        <div className="h-64 md:h-80 relative">
          <img src={groupCover} alt={`${group.name} cover`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white">{group.name}</h1>
            <p className="text-lg text-gray-300 mt-2">{group.description}</p>
          </div>
          {isAdmin && (
            <div className="absolute top-4 right-4 space-x-2">
              <input type="file" ref={fileInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploadingCover} 
                className="bg-black/50 text-white py-2 px-4 rounded-lg flex items-center hover:bg-black/75 transition-colors"
              >
                <Camera size={18} className="mr-2" />
                {isUploadingCover ? 'Uploading...' : 'Change Cover'}
              </button>
              <button 
                onClick={() => setIsAdminModalOpen(true)} 
                className="bg-black/50 text-white py-2 px-4 rounded-lg flex items-center hover:bg-black/75 transition-colors"
              >
                <Settings size={18} className="mr-2" /> Manage
              </button>
            </div>
          )}
        </div>

        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <LeftSidebar />
            <div className="flex-grow">
              {isMember && <CreatePost onPostCreated={fetchGroupPosts} groupId={groupId} />}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Group Posts</h2>
                {isLoadingPosts ? ( // Use isLoadingPosts here
                  <p className="text-gray-400 flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin mr-2" /> Loading posts...</p>
                ) : posts.length > 0 ? (
                  posts.map(post => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      onPostDeleted={handlePostDeleted} 
                      onPostUpdated={handlePostUpdated} 
                      groupAdminId={group.admin} 
                    />
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-10">No posts in this group yet.</p>
                )}
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
                        <img src={member.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${member.fullName.charAt(0)}`} alt={member.fullName} className="w-10 h-10 rounded-full object-cover" />
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
          onGroupUpdate={handleGroupUpdated}
          onGroupDelete={handleGroupDeleted}
        />
      )}
    </>
  );
};

export default GroupDetailPage;
