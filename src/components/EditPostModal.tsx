import { useState, useEffect } from 'react';
import { X, UploadCloud } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Define the shape of the Post data for editing
interface PostAuthor {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
}

interface Post {
  _id: string;
  user: PostAuthor;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'Photo' | 'Video';
  likes: string[];
  comments: any[];
  group?: { _id: string; admin: string; };
  reactions: any[];
}

type EditPostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPost: Post) => void; // Callback to update post in parent
  post: Post; // The post data to be edited
};

const EditPostModal = ({ isOpen, onClose, onSuccess, post }: EditPostModalProps) => {
  const { token } = useAuth();
  const [title, setTitle] = useState(post.title || '');
  const [description, setDescription] = useState(post.description || '');
  const [mediaUrl, setMediaUrl] = useState(post.mediaUrl || ''); // Current media URL
  const [mediaType, setMediaType] = useState(post.mediaType || ''); // Current media type

  const [newMediaFile, setNewMediaFile] = useState<File | null>(null); // For new file upload
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Update form fields if post prop changes
  useEffect(() => {
    setTitle(post.title || '');
    setDescription(post.description || '');
    setMediaUrl(post.mediaUrl || '');
    setMediaType(post.mediaType || '');
    setNewMediaFile(null); // Clear new file selection on post change
  }, [post]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewMediaFile(e.target.files[0]);
      setError('');
      // Update preview immediately
      if (e.target.files[0].type.startsWith('image')) {
        setMediaType('Photo');
      } else if (e.target.files[0].type.startsWith('video')) {
        setMediaType('Video');
      }
    }
  };

  const uploadMedia = async () => {
    if (!newMediaFile || !token) return;

    setIsUploadingMedia(true);
    const formData = new FormData();
    formData.append('file', newMediaFile); // 'file' must match backend multer field

    try {
      // Use the createPost endpoint for file upload, but only care about the URL
      // In a more complex app, you'd have a dedicated media upload endpoint
      const response = await api.post('/api/posts', formData, { // Reusing post creation for file upload
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // The backend createPost returns the full post, we just need the mediaUrl
      setMediaUrl(response.data.mediaUrl);
      setMediaType(response.data.mediaType);
      setNewMediaFile(null);
      return { mediaUrl: response.data.mediaUrl, mediaType: response.data.mediaType };
    } catch (err: any) {
      console.error('Failed to upload new media:', err);
      setError(err.response?.data?.message || 'Failed to upload new media.');
      throw err;
    } finally {
      setIsUploadingMedia(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    let finalMediaUrl = mediaUrl;
    let finalMediaType = mediaType;

    try {
      // If a new file is selected, upload it first
      if (newMediaFile) {
        const uploadedMedia = await uploadMedia();
        if (uploadedMedia) {
          finalMediaUrl = uploadedMedia.mediaUrl;
          finalMediaType = uploadedMedia.mediaType;
        }
      }

      // Now, update the post details
      const response = await api.put(`/api/posts/${post._id}`, { // Assuming a PUT /api/posts/:id endpoint for updating posts
        title,
        description,
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      onSuccess(response.data); // Notify parent with the updated post
      onClose();
    } catch (err: any) {
      console.error('Failed to update post:', err);
      const message = err.response?.data?.message || 'Failed to update post. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Edit Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-md">{error}</div>}
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
            <input 
              type="text" 
              name="title" 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description (Optional)</label>
            <textarea 
              name="description" 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3} 
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" 
            ></textarea>
          </div>

          {/* Current Media Preview & New Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Media</label>
            {mediaUrl ? (
              mediaType === 'Photo' ? (
                <img src={newMediaFile ? URL.createObjectURL(newMediaFile) : mediaUrl} alt="Current Media" className="w-full h-48 object-cover rounded-md mb-2" />
              ) : (
                <video src={newMediaFile ? URL.createObjectURL(newMediaFile) : mediaUrl} controls className="w-full h-48 object-contain bg-black rounded-md mb-2">
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <p className="text-gray-400 mb-2">No media attached to this post.</p>
            )}
            
            <label htmlFor="media-upload" className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center space-x-2">
              <UploadCloud size={20} />
              <span>{isUploadingMedia ? 'Uploading New Media...' : 'Upload New Photo/Video'}</span>
              <input 
                id="media-upload" 
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept="image/*,video/*" 
                disabled={isUploadingMedia}
              />
            </label>
            {newMediaFile && <p className="text-sm text-gray-400 mt-2">Selected: {newMediaFile.name}</p>}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isUploadingMedia} 
              className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
