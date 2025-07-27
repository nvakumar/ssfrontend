// src/components/CommentSection.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Trash2 } from 'lucide-react';

// Define the shape of the Comment data
interface CommentUser {
  _id: string;
  fullName: string;
  avatar?: string;
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
  postOwnerId: string; // 👈 Add postOwnerId to props
  initialComments: Comment[];
  onCommentChange: (comments: Comment[]) => void; // Callback to update parent state
  groupAdminId?: string;
};

const CommentSection = ({ postId, postOwnerId, initialComments, onCommentChange, groupAdminId }: CommentSectionProps) => {
  const { user, token } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(
        `/api/posts/${postId}/comment`,
        { text: newComment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
    if (!window.confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    try {
        await api.delete(`/api/posts/${postId}/comment/${commentId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        // Use callback to update parent state
        const updatedComments = initialComments.filter(comment => comment._id !== commentId);
        onCommentChange(updatedComments);
    } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
    }
  };
  
  const userAvatar = user?.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${user?.fullName?.charAt(0)}`;

  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-700">
      {/* Add a Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex items-start space-x-3 mt-4">
        <img src={userAvatar} alt="Your avatar" className="w-9 h-9 rounded-full" />
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
        {initialComments.map((comment) => (
          <div key={comment._id} className="flex items-start space-x-3 group">
            <img 
              src={comment.user.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${comment.user.fullName.charAt(0)}`} 
              alt={comment.user.fullName} 
              className="w-9 h-9 rounded-full" 
            />
            <div className="flex-grow p-3 bg-gray-700 rounded-lg">
              <p className="font-semibold text-sm text-white">{comment.user.fullName}</p>
              <p className="text-sm text-gray-300">{comment.text}</p>
            </div>
            {/* 👇 Updated condition to show delete button for comment author OR post owner */}
            {user && (comment.user._id === user._id || postOwnerId === user._id) && (
                <button 
                    onClick={() => handleDeleteComment(comment._id)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={16} />
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
