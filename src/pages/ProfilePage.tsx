import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import UserListModal from '../components/UserListModal';
import { MessageSquare, Edit, FileText, UserPlus, UserMinus, Award, Loader2, XCircle, MapPin } from 'lucide-react'; // Added MapPin icon

// Define types for data
interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  followers: string[];
  following: string[];
  resumeUrl?: string;
  profilePictureUrl?: string;
  location?: string; // 👈 Added location to UserProfile interface
}

interface Post {
  _id: string;
  user: UserProfile;
  title: string;
  mediaUrl: string;
  mediaType: 'Photo' | 'Video';
  likes: string[];
  comments: any[];
}

interface SimpleUser {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
  location?: string; // Added location to SimpleUser for lists
}

interface LeaderboardEntry {
  userId: string;
  fullName: string;
  role: string;
  avatar?: string;
  totalLikes: number;
  totalPosts: number;
  engagementScore: number;
}


const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<SimpleUser[]>([]);
  const [followingList, setFollowingList] = useState<SimpleUser[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [listError, setListError] = useState('');

  const [isOnLeaderboard, setIsOnLeaderboard] = useState(false);


  // Function to fetch profile data
  const fetchProfileData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/users/${id}`);
      const fetchedProfile: UserProfile = response.data.user;
      const fetchedPosts: Post[] = response.data.posts;

      // --- DEBUG LOG START ---
      console.log("ProfilePage: Fetched Profile Data:", fetchedProfile);
      console.log("ProfilePage: Profile Avatar URL:", fetchedProfile.avatar);
      console.log("ProfilePage: Profile profilePictureUrl:", fetchedProfile.profilePictureUrl);
      console.log("ProfilePage: Profile Location:", fetchedProfile.location); // Log location
      // --- DEBUG LOG END ---

      setProfile(fetchedProfile);
      setPosts(fetchedPosts);
      setFollowersCount(fetchedProfile.followers.length);

      if (currentUser && fetchedProfile.followers.includes(currentUser._id)) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }

    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      setError(err.response?.data?.message || "Failed to load profile. The user may not exist or an error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch followers/following lists
  const fetchUserList = async (listType: 'followers' | 'following') => {
    if (!profile || !token) return;
    setIsLoadingLists(true);
    setListError('');
    try {
      const ids = listType === 'followers' ? profile.followers : profile.following;
      
      const fetchedUsers: SimpleUser[] = [];
      for (const userId of ids) {
        try {
          const response = await api.get(`/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchedUsers.push({
            _id: response.data.user._id,
            fullName: response.data.user.fullName,
            role: response.data.user.role,
            avatar: response.data.user.profilePictureUrl,
            location: response.data.user.location, // 👈 Include location here
          });
        } catch (innerErr) {
          console.warn(`Could not fetch details for user ID: ${userId}`, innerErr);
        }
      }

      if (listType === 'followers') {
        setFollowersList(fetchedUsers);
      } else {
        setFollowingList(fetchedUsers);
      }

    } catch (err: any) {
      console.error(`Failed to fetch ${listType} list:`, err);
      setListError(`Failed to load ${listType}.`);
    } finally {
      setIsLoadingLists(false);
    }
  };

  // New useEffect to check leaderboard status
  useEffect(() => {
    const checkLeaderboardStatus = async () => {
      if (!id || !token) return;
      try {
        const response = await api.get('/api/leaderboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const leaderboardData: LeaderboardEntry[] = response.data;
        const foundOnLeaderboard = leaderboardData.some(entry => entry.userId === id);
        setIsOnLeaderboard(foundOnLeaderboard);
      } catch (err) {
        console.error("Failed to fetch leaderboard for profile check:", err);
        setIsOnLeaderboard(false);
      }
    };
    checkLeaderboardStatus();
  }, [id, token]);


  useEffect(() => {
    fetchProfileData();
  }, [id, currentUser, token]);

  const handleFollowToggle = async () => {
    if (!currentUser || !token || !profile) {
      alert('You must be logged in to follow/unfollow a user.');
      return;
    }

    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);

    try {
      if (isFollowing) {
        await api.delete(`/api/users/${profile._id}/follow`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post(`/api/users/${profile._id}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchProfileData(); 
    }
    catch (err: any) {
      console.error("Failed to toggle follow status:", err);
      setIsFollowing(!isFollowing);
      setFollowersCount(isFollowing ? followersCount + 1 : followersCount - 1);
      alert(err.response?.data?.message || 'Failed to update follow status. Please try again.');
    }
  };

  const handleEditSuccess = () => {
    fetchProfileData();
    setIsEditModalOpen(false);
  };

  const handleMessageUser = () => {
    if (profile) {
      navigate(`/messages?with=${profile._id}`); 
    }
  };

  const openFollowersModal = () => {
    setShowFollowersModal(true);
    fetchUserList('followers');
  };

  const openFollowingModal = () => {
    setShowFollowingModal(true);
    fetchUserList('following');
  };


  if (isLoading) {
    return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center"><Loader2 size={32} className="animate-spin mr-2" /> Loading profile...</div>;
  }

  if (error) {
    return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center"><XCircle size={24} className="mr-2"/> {error}</div>;
  }

  if (!profile) {
    return null;
  }
  
  const userAvatar = profile.profilePictureUrl || profile.avatar || `https://placehold.co/150x150/1a202c/ffffff?text=${profile.fullName.charAt(0)}`;
  const isOwnProfile = currentUser && currentUser._id === profile._id;

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Header />
      <main className="pt-16 container mx-auto px-4">
        {/* Profile Header */}
        <div className="p-4 md:p-8 bg-gray-800 rounded-lg mt-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative">
              <img src={userAvatar} alt={profile.fullName} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-700 object-cover" />
              {isOnLeaderboard && (
                <div 
                  className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 bg-yellow-500 rounded-full p-2 border-2 border-gray-900 shadow-lg"
                >
                  <Award size={24} className="text-white" />
                </div>
              )}
            </div>
            <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left flex-grow">
              <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start">
                {profile.fullName}
                {isOnLeaderboard && (
                  <Award size={24} className="ml-3 text-yellow-400" />
                )}
              </h1>
              <p className="text-lg text-indigo-400">{profile.role}</p>
              {profile.location && ( // 👈 Display location if available
                <p className="text-gray-400 mt-1 flex items-center justify-center md:justify-start">
                  <MapPin size={16} className="mr-2" /> {profile.location}
                </p>
              )}
              <p className="text-gray-400 mt-2">{profile.bio || 'This user has not added a bio yet.'}</p>
              
              {/* Skills Display */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                  {profile.skills.map(skill => (
                    <span key={skill} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Follower/Following Stats (clickable) */}
              <div className="flex justify-center md:justify-start space-x-6 mt-4 text-gray-300">
                <button onClick={openFollowersModal} className="hover:text-white transition-colors">
                  <span className="font-bold text-white">{followersCount}</span> Followers
                </button>
                <button onClick={openFollowingModal} className="hover:text-white transition-colors">
                  <span className="font-bold text-white">{profile.following.length}</span> Following
                </button>
                <div>
                  <span className="font-bold text-white">{posts.length}</span> Posts
                </div>
              </div>

              {/* Resume Link */}
              {profile.resumeUrl && (
                <div className="mt-4 flex justify-center md:justify-start">
                  <a 
                    href={profile.resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-4 py-2 rounded-md font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <FileText size={18} /> <span>View Resume</span>
                  </a>
                </div>
              )}

              {/* Action Buttons: Edit / Follow / Message */}
              <div className="flex justify-center md:justify-start space-x-4 mt-6">
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-6 py-2 rounded-md font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 flex items-center"
                  >
                    <Edit size={18} className="mr-2" /> Edit Profile
                  </button>
                )}
                {!isOwnProfile && currentUser && (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      disabled={!token} // Disable if not logged in
                      className={`px-6 py-2 rounded-md font-bold transition-colors duration-200 flex items-center ${
                        isFollowing 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isFollowing ? <><UserMinus size={18} className="mr-2" /> Following</> : <><UserPlus size={18} className="mr-2" /> Follow</>}
                    </button>
                    <button
                      onClick={handleMessageUser}
                      className="px-6 py-2 rounded-md font-bold text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 flex items-center"
                    >
                      <MessageSquare size={18} className="mr-2" /> Message
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <div key={post._id} className="bg-gray-800 rounded-lg overflow-hidden">
                  {post.mediaType === 'Photo' ? (
                    <img src={post.mediaUrl} alt={post.title} className="w-full h-48 object-cover" />
                  ) : (
                    <video src={post.mediaUrl} className="w-full h-48 object-cover" controls>
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <div className="p-4">
                    <p className="font-semibold truncate text-white">{post.title}</p>
                    <p className="text-sm text-gray-400">{post.user.fullName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400">This user hasn't posted any work yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          initialData={{
            bio: profile.bio || '',
            skills: profile.skills || [],
            profilePictureUrl: profile.profilePictureUrl || '',
            resumeUrl: profile.resumeUrl || '',
            location: profile.location || '' // 👈 Include location here
          }}
        />
      )}

      {/* Followers List Modal */}
      {showFollowersModal && (
        <UserListModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          title="Followers"
          users={followersList}
          isLoading={isLoadingLists}
          error={listError}
        />
      )}

      {/* Following List Modal */}
      {showFollowingModal && (
        <UserListModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          title="Following"
          users={followingList}
          isLoading={isLoadingLists}
          error={listError}
        />
      )}
    </div>
  );
};

export default ProfilePage;
