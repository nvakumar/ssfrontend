import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, MessageCircle, Share2, Trash2, Edit, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CommentSection from './CommentSection';
import EditPostModal from './EditPostModal';

// Define the shape of the Post data coming from the API
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
  comments: { _id: string; user: PostAuthor; text: string; createdAt: string; }[];
  group?: { _id: string; admin: string; };
  reactions: any[];
}

type PostCardProps = {
  post: Post;
  onPostDeleted: (postId: string) => void;
  onPostUpdated: (updatedPost: Post) => void;
  groupAdminId?: string;
};

const PostCard = ({ post, onPostDeleted, onPostUpdated, groupAdminId }: PostCardProps) => {
  const { user: currentUser, token } = useAuth();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsLiked(post.likes.includes(currentUser._id));
      setLikeCount(post.likes.length);
    }
  }, [currentUser, post.likes]);

  useEffect(() => {
    setComments(post.comments);
  }, [post.comments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLike = async () => {
    if (!currentUser) {
      alert('You must be logged in to like a post.');
      return;
    }

    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;

    setIsLiked(!originalIsLiked);
    setLikeCount(originalIsLiked ? originalLikeCount - 1 : originalLikeCount + 1);

    try {
      await api.put(`/api/posts/${post._id}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Failed to update like status:", error);
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
      alert('Failed to like the post. Please try again.');
    }
  };

  const handleCommentChange = (updatedComments: any[]) => {
    setComments(updatedComments);
  };

  const handleDeletePost = async () => {
    if (!token) {
      alert('You must be logged in to delete a post.');
      return;
    }
    setShowConfirmDelete(false);
    setShowMenu(false);

    try {
      await api.delete(`/api/posts/${post._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onPostDeleted(post._id);
    }
    catch (error: any) {
      console.error("Failed to delete post:", error);
      alert(error.response?.data?.message || 'Failed to delete post. Please try again.');
    }
  };

  const handleEditPost = () => {
    setIsEditPostModalOpen(true);
    setShowMenu(false);
  };

  const onPostEditSuccess = (updatedPost: Post) => {
    onPostUpdated(updatedPost);
    setIsEditPostModalOpen(false);
  };

  const handleSharePost = () => {
    setShowMenu(false);
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => alert('Post link copied to clipboard!'))
      .catch(() => alert('Failed to copy link.'));
  };

  // Always display uploaded profile picture if available, else placeholder
  const authorAvatar =
    post.user.profilePictureUrl && post.user.profilePictureUrl.trim() !== ""
      ? post.user.profilePictureUrl
      : post.user.avatar && post.user.avatar.trim() !== ""
        ? post.user.avatar
        : `https://placehold.co/100x100/1a202c/ffffff?text=${post.user.fullName.charAt(0)}`;

  const isPostOwner = currentUser && post.user._id === currentUser._id;
  const isGroupAdmin = currentUser && post.group && post.group.admin === currentUser._id;
  const canModifyPost = isPostOwner || isGroupAdmin;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
      {/* Card Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${post.user._id}`} className="flex items-center space-x-3">
          <img
            src={authorAvatar}
            alt={post.user.fullName}
            className="w-16 h-16 rounded-full border-4 border-indigo-600 object-cover mr-2 bg-gray-900"
          />
          <div>
            <p className="font-semibold text-white hover:underline">{post.user.fullName}</p>
            <p className="text-sm text-gray-400">{post.user.role}</p>
          </div>
        </Link>
        {canModifyPost && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors duration-200"
              title="Post Options"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleEditPost}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Edit size={16} /> <span>Edit Post</span>
                </button>
                <button
                  onClick={handleSharePost}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Share2 size={16} /> <span>Share Post</span>
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Trash2 size={16} /> <span>Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-4 pb-2">
        <p className="text-gray-300 mb-2">{post.title}</p>
        {post.description && <p className="text-sm text-gray-400 mb-2">{post.description}</p>}
      </div>
      {post.mediaUrl && (
        post.mediaType === 'Photo' ? (
          <img src={post.mediaUrl} alt={post.title} className="w-full h-auto max-h-96 object-cover" />
        ) : (
          <video src={post.mediaUrl} controls className="w-full h-auto max-h-96 object-contain bg-black">
            Your browser does not support the video tag.
          </video>
        )
      )}

      {/* Card Footer */}
      <div className="p-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{likeCount} Likes</span>
          <span>{comments.length} Comments</span>
        </div>
        <hr className="border-gray-700" />
        <div className="flex justify-around mt-2">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-md transition-colors duration-200 ${
              isLiked ? 'text-indigo-400 bg-indigo-900/20' : 'text-gray-300 hover:text-indigo-400 hover:bg-gray-700'
            }`}
          >
            <ThumbsUp size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span>Like</span>
          </button>
          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-md transition-colors duration-200 ${
              showComments ? 'text-indigo-400 bg-indigo-900/20' : 'text-gray-300 hover:text-indigo-400 hover:bg-gray-700'
            }`}
          >
            <MessageCircle size={20} />
            <span>Comment</span>
          </button>
        </div>
      </div>

      {/* Comment Section */}
      {showComments && (
        <CommentSection 
          postId={post._id} 
          initialComments={comments} 
          onCommentChange={handleCommentChange} 
          postOwnerId={post.user._id}
          groupAdminId={post.group?.admin}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
            <p className="text-gray-300">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-6 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-6 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditPostModalOpen && (
        <EditPostModal
          isOpen={isEditPostModalOpen}
          onClose={() => setIsEditPostModalOpen(false)}
          onSuccess={onPostEditSuccess}
          post={post}
        />
      )}
    </div>
  );
};

export default PostCard;