import React, { useState, useEffect, useCallback } from 'react'; // Keep React import
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import LeaderboardWidget from '../components/LeaderboardWidget';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Define a type for our Post data to match the backend model
interface PostAuthor {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string; // Ensure this field is expected from the API
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
  group?: { _id: string; admin: string; };
  reactions: any[];
}

// NEW: Define a specific type for the user object from our AuthContext
interface CurrentUser {
    _id: string;
    fullName: string;
    role: string;
    avatar?: string;
    profilePictureUrl?: string;
}

const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // UPDATED: Get the full currentUser object from the auth context
  const { token, user: currentUser } = useAuth() as { token: string | null; user: CurrentUser | null };

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await api.get('/api/posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // UPDATED: Format posts on fetch to ensure correct avatar is used initially
      const formattedPosts = response.data.map((post: Post) => ({
        ...post,
        user: {
            ...post.user,
            avatar: post.user.profilePictureUrl || post.user.avatar,
        }
      }));
      setPosts(formattedPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // NEW: This effect syncs the posts in the feed with any global user profile changes.
  useEffect(() => {
    if (!currentUser) return;

    setPosts(prevPosts =>
      prevPosts.map(post => {
        // If the post's author is the currently logged-in user...
        if (post.user._id === currentUser._id) {
          // ...update its author info to match the latest global user state.
          return {
            ...post,
            user: {
              ...post.user,
              fullName: currentUser.fullName,
              avatar: currentUser.profilePictureUrl || currentUser.avatar,
            },
          };
        }
        // Otherwise, return the post as is.
        return post;
      })
    );
  }, [currentUser]); // This runs whenever the currentUser object is updated in the context

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
  };

  // NEW: Add a handler to update a single post's state after a like or comment
  const handlePostUpdated = (updatedPost: Post) => { // Corrected prop name to onPostUpdated
    setPosts(prevPosts => 
      prevPosts.map(post => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Header />
      <main className="pt-16 container mx-auto px-4">
        <div className="flex flex-col md:flex-row">
          <LeftSidebar />
          
          <div className="flex-grow p-4 md:mx-4">
             <div className="w-full max-w-2xl mx-auto">
                <CreatePost onPostCreated={fetchPosts} />

                {isLoading ? (
                  <p className="text-center text-gray-400 mt-8">Loading feed...</p>
                ) : posts.length > 0 ? (
                  <div className="space-y-6 mt-6">
                    {posts.map((post) => (
                      <PostCard 
                        key={post._id} 
                        post={post} 
                        onPostDeleted={handlePostDeleted}
                        onPostUpdated={handlePostUpdated} // Corrected prop name
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 mt-8">No posts yet. Be the first to share your work!</p>
                )}
             </div>
          </div>

          <aside className="w-full md:w-80 p-4 flex-shrink-0">
             <div className="space-y-6 h-full md:h-[calc(100vh-4rem)] md:sticky top-16">
                <LeaderboardWidget />
             </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default FeedPage;
