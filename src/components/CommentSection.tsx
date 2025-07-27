import React, { useState, useEffect } from 'react'; // Keep React import for useEffect
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Trash2 } from 'lucide-react'; // Import Trash2 for delete icon

// Define the shape of the Comment data
interface CommentUser {
  _id: string;
  fullName: string;
  avatar?: string; // Added avatar to CommentUser interface
}
interface Comment {
  _id: string;
  user: CommentUser;
  text: string;
  createdAt: string;
}

// Define the props the component will receive
type CommentSectionProps = {
  postId: string;
  initialComments: Comment[];
  onCommentChange: (updatedComments: Comment[]) => void; // Callback to update parent state
  postOwnerId: string; // Add postOwnerId to props
  groupAdminId?: string; // Make optional as it might not always be present
};

const CommentSection = ({ postId, initialComments, onCommentChange, postOwnerId, groupAdminId }: CommentSectionProps) => {
  const { user: currentUser, token } = useAuth(); // Destructure user as currentUser
  const [comments, setComments] = useState<Comment[]>(initialComments); // Local state for comments
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local comments state if initialComments prop changes (e.g., from parent refresh)
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);


  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return; // Use currentUser

    setIsSubmitting(true);
    try {
      const response = await api.post(
        `/api/posts/${postId}/comment`,
        { text: newComment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments(response.data); // Update local state with new comments from backend
      onCommentChange(response.data); // Use callback to update parent
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) {
      alert('You must be logged in to delete a comment.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    try {
        await api.delete(`/api/posts/${postId}/comment/${commentId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        // Filter out the deleted comment from local state
        const updatedComments = comments.filter(comment => comment._id !== commentId); // Use local 'comments' state
        setComments(updatedComments);
        onCommentChange(updatedComments); // Use callback to update parent
    } catch (error: any) {
        console.error('Failed to delete comment:', error);
        alert(error.response?.data?.message || 'Failed to delete comment. Please try again.');
    }
  };
  
  const currentUserAvatar = currentUser?.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${currentUser?.fullName?.charAt(0) || 'U'}`;

  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-700">
      {/* Add a Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex items-start space-x-3 mt-4">
        <img src={currentUserAvatar} alt="Your avatar" className="w-9 h-9 rounded-full object-cover" />
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-grow p-2 text-sm text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={1}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500"
        >
          Post
        </button>
      </form>

      {/* List of Comments */}
      <div className="mt-4 space-y-4">
        {comments.map((comment) => { // Use local 'comments' state for mapping
          const commentAuthorAvatar = comment.user.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${comment.user.fullName.charAt(0)}`;
          const isCommentOwner = currentUser && comment.user._id === currentUser._id;
          const isPostOwner = currentUser && postOwnerId === currentUser._id;
          const isGroupAdmin = currentUser && groupAdminId === currentUser._id; // Explicitly use groupAdminId
          const canDeleteComment = isCommentOwner || isPostOwner || isGroupAdmin;

          return (
            <div key={comment._id} className="flex items-start space-x-3 group">
              <img 
                src={commentAuthorAvatar} 
                alt={comment.user.fullName} 
                className="w-9 h-9 rounded-full object-cover flex-shrink-0" 
              />
              <div className="flex-grow p-3 bg-gray-700 rounded-lg">
                <p className="font-semibold text-sm text-white">{comment.user.fullName}</p>
                <p className="text-sm text-gray-300">{comment.text}</p>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
              {canDeleteComment && (
                <button 
                    onClick={() => handleDeleteComment(comment._id)}
                    className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-600 transition-opacity flex-shrink-0" // Removed opacity-0 group-hover:opacity-100 for always visible
                    title="Delete Comment"
                >
                    <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentSection;
