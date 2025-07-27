import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import GroupAdminModal from '../components/GroupAdminModal';
import { LogOut, UserPlus, Camera, Settings, Loader2, XCircle } from 'lucide-react';

interface PostAuthor {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string;
}

interface Post {
  _id: string;
  user: PostAuthor;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'Photo' | 'Video';
  likes: string[];
  comments: { _id: string; user: PostAuthor; text: string; createdAt: string }[];
  reactions: any[];
  group?: { _id: string; admin: string };
}

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
  coverImageUrl?: string;
  admin: string;
  members: GroupMember[];
  isPrivate: boolean;
}

const GroupDetailPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user: currentUser, token } = useAuth();

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isMember, setIsMember] = useState<boolean | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Fetch group details
  const fetchGroupDetails = useCallback(async () => {
    if (!groupId || !token) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedGroup: GroupDetails = response.data;
      setGroup(fetchedGroup);

      if (currentUser) {
        const memberFound = fetchedGroup.members.some(m => m._id === currentUser._id);
        setIsMember(memberFound);
      } else {
        setIsMember(false);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch group details:', err);
      if (err instanceof Error) setError(err.message);
      else setError('Failed to load group details.');

      // Redirect if group not found or access forbidden
      const status = (err as any)?.response?.status;
      if (status === 404 || status === 403) {
        navigate('/groups');
      }
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token, currentUser, navigate]);

  // Fetch posts of the group
  const fetchGroupPosts = useCallback(async () => {
    if (!groupId || !token) return;
    setIsLoadingPosts(true);
    try {
      const response = await api.get(`/api/groups/${groupId}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data as Post[]);
    } catch (err: unknown) {
      console.error('Failed to fetch group posts:', err);
      const status = (err as any)?.response?.status;
      if (status !== 403) {
        if (err instanceof Error) setError(err.message);
        else setError('Failed to load posts.');
      }
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    fetchGroupDetails();
    fetchGroupPosts();
  }, [fetchGroupDetails, fetchGroupPosts]);

  // Handle join/leave action
  const handleJoinLeave = async () => {
    if (!groupId || !token || !group || !currentUser) return;
    setIsProcessing(true);
    setError('');
    const endpoint = isMember ? `/api/groups/${groupId}/leave` : `/api/groups/${groupId}/join`;

    try {
      await api.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchGroupDetails();  // FIXED from fetchGroupData()
    } catch (err: unknown) {
      console.error(`Failed to ${isMember ? 'leave' : 'join'} group:`, err);
      if (err instanceof Error) setError(err.message);
      else setError(`Failed to ${isMember ? 'leave' : 'join'} group.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cover image upload handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length && groupId && group) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('coverImage', file);

      setIsUploadingCover(true);
      setError('');

      try {
        const response = await api.put(`/api/groups/${groupId}/cover`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        setGroup(response.data);
      } catch (err: unknown) {
        console.error('Failed to upload cover image:', err);
        if (err instanceof Error) setError(err.message);
        else setError('Failed to upload cover image.');
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  // Post deleted handler
  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(posts => posts.filter(p => p._id !== deletedPostId));
  };

  // Post updated handler
  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(posts => posts.map(p => (p._id === updatedPost._id ? updatedPost : p)));
  };

  // Group updated handler (e.g., privacy change)
  const handleGroupUpdated = (updatedGroup: GroupDetails) => {
    setGroup(updatedGroup);
    if (updatedGroup.isPrivate !== group?.isPrivate) {
      fetchGroupPosts();
    }
  };

  // Group deleted handler
  const handleGroupDeleted = (deletedGroupId: string) => {
    console.log(`Group ${deletedGroupId} deleted.`);
    navigate('/groups');
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <Loader2 size={32} className="mr-2 animate-spin" /> Loading group...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <XCircle size={24} className="mr-2" /> {error}
      </div>
    );
  }

  if (!group) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        Group not found.
      </div>
    );
  }

  const isAdmin = currentUser?.id === group.admin || currentUser?.id === null ? false : currentUser?.id === group.admin;
  const groupCover = group.coverImageUrl || `https://placehold.co/1200x300/1f2937/ffffff?text=${encodeURIComponent(group.name)}`;

  return (
    <>
      <div className="bg-gray-900 min-h-screen text-white">
        <Header />
        <div className="relative h-64 md:h-80">
          <img src={groupCover} alt={`${group.name} cover`} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white">{group.name}</h1>
            <p className="mt-2 text-lg text-gray-300">{group.description}</p>
          </div>
          {isAdmin && (
            <div className="absolute top-4 right-4 space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleCoverUpload}
              />
              <button
                type="button"
                aria-label="Change group cover image"
                disabled={isUploadingCover}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 space-x-2 text-white bg-black/50 rounded-lg hover:bg-black/75"
              >
                <Camera size={18} /> 
                <span>{isUploadingCover ? 'Uploading...' : 'Change Cover'}</span>
              </button>
              <button
                type="button"
                aria-label="Open group management"
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center px-4 py-2 space-x-2 text-white bg-black/50 rounded-lg hover:bg-black/75"
              >
                <Settings size={18} />
                <span>Manage</span>
              </button>
            </div>
          )}
        </div>

        <main className="container px-4 py-6 mx-auto">
          <div className="flex flex-col gap-6 md:flex-row">
            <LeftSidebar />
            <div className="flex-grow">
              {isMember && <CreatePost onPostCreated={fetchGroupPosts} groupId={groupId} />}
              <div className="space-y-6">
                <h2 className="mb-4 text-2xl font-bold text-white">Group Posts</h2>
                {isLoadingPosts ? (
                  <p className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 size={24} className="mr-2 animate-spin" />
                    Loading posts...
                  </p>
                ) : posts.length > 0 ? (
                  posts.map(post => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onPostDeleted={handlePostDeleted}
                      onPostUpdated={handlePostUpdated}
                      groupAdminId={group.admin} // Only pass this prop if PostCard accepts it
                    />
                  ))
                ) : (
                  <p className="py-10 text-center text-gray-400">No posts in this group yet.</p>
                )}
              </div>
            </div>
            <aside className="w-full space-y-6 md:w-80 lg:w-96 flex-shrink-0">
              <div className="rounded-lg bg-gray-800 p-4">
                <button
                  type="button"
                  aria-disabled={isProcessing || isAdmin}
                  disabled={isProcessing || isAdmin}
                  onClick={handleJoinLeave}
                  className={`w-full flex items-center justify-center rounded-md px-4 py-2 font-bold transition-colors 
                    ${isAdmin ? 'cursor-not-allowed bg-gray-600' : isMember ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                    disabled:bg-gray-500
                  `}
                >
                  {isAdmin ? (
                    'You are the Admin'
                  ) : isMember ? (
                    <>
                      <LogOut size={18} className="mr-2" />
                      Leave Group
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} className="mr-2" />
                      Join Group
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-lg bg-gray-800 p-4">
                <h3 className="mb-4 text-lg font-bold text-white">Members ({group.members.length})</h3>
                <ul>
                  {group.members.slice(0, 10).map(member => (
                    <li key={member._id}>
                      <Link
                        to={`/profile/${member._id}`}
                        className="flex items-center space-x-3 rounded-md p-2 hover:bg-gray-700/50"
                      >
                        <img
                          src={member.avatar || `https://placehold.co/100x100/1f2937/ffffff?text=${member?.fullName[0] ?? 'U'}`}
                          alt={member.fullName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p>{member.fullName}</p>
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

        {isAdminModalOpen && group && (
          <GroupAdminModal
            group={group}
            onClose={() => setIsAdminModalOpen(false)}
            onGroupDeleted={handleGroupDeleted}
            onGroupUpdate={handleGroupUpdated}
          />
        )}
      </>
    );
};

export default GroupDetailPage;
