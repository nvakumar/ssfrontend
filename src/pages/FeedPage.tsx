import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import LeaderboardWidget from '../components/LeaderboardWidget';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Define types
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

interface CurrentUser {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string;
}

const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // typed for current user and token from context
  const { token, user: currentUser } = useAuth() as {
    token: string | null;
    user: CurrentUser | null;
  };

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Post[]>('/api/posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Normalize avatar field consistently
      const formattedPosts = response.data.map((post) => ({
        ...post,
        user: {
          ...post.user,
          avatar: post.user.profilePictureUrl || post.user.avatar,
        },
      }));

      setPosts(formattedPosts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      if (err instanceof Error) setError(err.message);
      else setError('Failed to load posts.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Update posts if currentUser's profile changes globally
  useEffect(() => {
    if (!currentUser) return;
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.user._id === currentUser._id
          ? {
              ...post,
              user: {
                ...post.user,
                fullName: currentUser.fullName,
                avatar: currentUser.profilePictureUrl || currentUser.avatar,
              },
            }
          : post
      )
    );
  }, [currentUser]);

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost._id ? updatedPost : post))
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
                <p
                  className="text-center mt-8 flex items-center justify-center text-gray-400"
                  role="status"
                  aria-live="polite"
                >
                  Loading feed...
                </p>
              ) : error ? (
                <p
                  className="text-center mt-8 text-red-500"
                  role="alert"
                >
                  {error}
                </p>
              ) : posts.length > 0 ? (
                <div className="space-y-6 mt-6">
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onPostDeleted={handlePostDeleted}
                      onPostUpdated={handlePostUpdated}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center mt-8 text-gray-400">
                  No posts yet. Be the first to share your work!
                </p>
              )}
            </div>
          </div>

          <aside className="w-full md:w-80 p-4">
            <div className="sticky top-20">
              <LeaderboardWidget />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default FeedPage;
