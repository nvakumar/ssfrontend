import { useState, useEffect } from 'react';
import { X, UploadCloud } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  group?: { _id: string; admin: string };
  reactions: any[];
}

type EditPostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPost: Post) => void;
  post: Post;
};

const EditPostModal = ({ isOpen, onClose, onSuccess, post }: EditPostModalProps) => {
  const { token } = useAuth();
  const [title, setTitle] = useState(post.title || '');
  const [description, setDescription] = useState(post.description || '');
  const [mediaUrl, setMediaUrl] = useState(post.mediaUrl || '');
  const [mediaType, setMediaType] = useState(post.mediaType || '');
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>(post.mediaUrl || '');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    setTitle(post.title || '');
    setDescription(post.description || '');
    setMediaUrl(post.mediaUrl || '');
    setMediaType(post.mediaType || '');
    setNewMediaFile(null);
    setError('');
  }, [post]);

  // Manage media preview URL and revoke on cleanup to prevent memory leaks
  useEffect(() => {
    if (newMediaFile) {
      const objectUrl = URL.createObjectURL(newMediaFile);
      setMediaPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
        setMediaPreviewUrl('');
      };
    } else {
      setMediaPreviewUrl(mediaUrl);
    }
  }, [newMediaFile, mediaUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewMediaFile(file);
      setError('');
      if (file.type.startsWith('image')) {
        setMediaType('Photo');
      } else if (file.type.startsWith('video')) {
        setMediaType('Video');
      } else {
        setMediaType('');
      }
    }
  };

  const uploadMedia = async (): Promise<{ mediaUrl: string; mediaType: 'Photo' | 'Video' } | null> => {
    if (!newMediaFile || !token) return null;

    setIsUploadingMedia(true);
    const formData = new FormData();
    formData.append('file', newMediaFile);

    try {
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const uploadedData = {
        mediaUrl: response.data.mediaUrl,
        mediaType: response.data.mediaType,
      };
      setMediaUrl(uploadedData.mediaUrl);
      setMediaType(uploadedData.mediaType);
      setNewMediaFile(null);
      return uploadedData;
    } catch (err: unknown) {
      console.error('Failed to upload new media:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload new media.');
      }
      return null;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!token) {
      setError('You must be logged in to edit a post.');
      setIsSubmitting(false);
      return;
    }

    let finalMediaUrl = mediaUrl;
    let finalMediaType = mediaType;

    try {
      if (newMediaFile) {
        const uploadedMedia = await uploadMedia();
        if (uploadedMedia) {
          finalMediaUrl = uploadedMedia.mediaUrl;
          finalMediaType = uploadedMedia.mediaType;
        } else {
          setIsSubmitting(false);
          return;
        }
      }

      const response = await api.put(
        `/api/posts/${post._id}`,
        {
          title,
          description,
          mediaUrl: finalMediaUrl,
          mediaType: finalMediaType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSuccess(response.data);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update post:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Edit Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-md">{error}</div>
          )}
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
              Title
            </label>
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
              Description (Optional)
            </label>
            <textarea
              name="description"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            ></textarea>
          </div>

          {/* Media Preview and Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Media</label>
            {mediaPreviewUrl ? (
              mediaType === 'Photo' ? (
                <img
                  src={mediaPreviewUrl}
                  alt="Current Media"
                  className="w-full h-48 object-cover rounded-md mb-2"
                />
              ) : (
                <video
                  src={mediaPreviewUrl}
                  controls
                  className="w-full h-48 object-contain bg-black rounded-md mb-2"
                >
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <p className="text-gray-400 mb-2">No media attached to this post.</p>
            )}

            <label
              htmlFor="media-upload"
              className={`cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${
                isUploadingMedia ? 'opacity-75 cursor-wait' : ''
              }`}
            >
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500"
            >
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
