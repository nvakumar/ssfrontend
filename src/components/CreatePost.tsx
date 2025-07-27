import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ImagePlus, Loader2 } from 'lucide-react'; // Removed Video as it's not directly used

type CreatePostProps = {
  onPostCreated: () => void;
  groupId?: string; // Optional groupId prop
};

const CreatePost = ({ onPostCreated, groupId }: CreatePostProps) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !file) { // Require either title or file
      setError('Please enter some text or select a file for your post.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    if (groupId) {
      formData.append('groupId', groupId);
    }
    // Only append the file if one is selected
    if (file) {
      formData.append('file', file);
      // Determine mediaType based on file type (optional, backend can also do this)
      if (file.type.startsWith('image')) {
        formData.append('mediaType', 'Photo');
      } else if (file.type.startsWith('video')) {
        formData.append('mediaType', 'Video');
      }
    }

    try {
      await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      
      setTitle('');
      setFile(null);
      onPostCreated();

    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={groupId ? "Post to the group..." : "Share your work..."}
          rows={3}
          required // Title is required
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-4">
            <label htmlFor="file-upload" className="flex items-center space-x-2 cursor-pointer text-gray-400 hover:text-white">
              <ImagePlus size={20} /> <span>Add Photo/Video</span>
            </label>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || (!title.trim() && !file)} // Disable if submitting OR (title is empty AND no file)
            className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Post'} {/* Added Loader2 */}
          </button>
        </div>
        {file && <p className="text-sm text-gray-400 mt-2">Selected: {file.name}</p>}
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default CreatePost;
