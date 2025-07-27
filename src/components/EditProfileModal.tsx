import { useState, useEffect } from 'react';
import { X, UploadCloud, FileText } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserProfileData {
  bio: string;
  skills: string[];
  profilePictureUrl: string;
  resumeUrl: string;
  location?: string;
}

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: UserProfileData;
};

const EditProfileModal = ({ isOpen, onClose, onSuccess, initialData }: EditProfileModalProps) => {
  const { user, token, login } = useAuth();

  const [bio, setBio] = useState(initialData.bio || '');
  const [skills, setSkills] = useState(initialData.skills ? initialData.skills.join(', ') : '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(initialData.profilePictureUrl || '');
  const [resumeUrl, setResumeUrl] = useState(initialData.resumeUrl || '');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(profilePictureUrl);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBio(initialData.bio || '');
      setSkills(initialData.skills ? initialData.skills.join(', ') : '');
      setProfilePictureUrl(initialData.profilePictureUrl || '');
      setResumeUrl(initialData.resumeUrl || '');
      setAvatarFile(null);
      setResumeFile(null);
      setError('');
    }
  }, [initialData]);

  // Manage avatar preview URL + revoke on file change/unmount
  useEffect(() => {
    if (avatarFile) {
      const objectUrl = URL.createObjectURL(avatarFile);
      setAvatarPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setAvatarPreviewUrl(profilePictureUrl);
    }
  }, [avatarFile, profilePictureUrl]);

  if (!isOpen) return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setError('');
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setError('');
    }
  };

  const uploadAvatar = async (): Promise<string | undefined> => {
    if (!avatarFile || !token) return undefined;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const response = await api.post('/api/users/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const url: string = response.data.profilePictureUrl;
      setProfilePictureUrl(url);
      setAvatarFile(null);
      return url;
    } catch (err: unknown) {
      console.error('Failed to upload avatar:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload profile picture.');
      }
      throw err;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const uploadResume = async (): Promise<string | undefined> => {
    if (!resumeFile || !token) return undefined;

    setIsUploadingResume(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const response = await api.post('/api/users/upload/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const url: string = response.data.resumeUrl;
      setResumeUrl(url);
      setResumeFile(null);
      return url;
    } catch (err: unknown) {
      console.error('Failed to upload resume:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload resume.');
      }
      throw err;
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    let finalProfilePictureUrl = profilePictureUrl;
    let finalResumeUrl = resumeUrl;

    try {
      if (avatarFile) {
        const url = await uploadAvatar();
        if (url) finalProfilePictureUrl = url;
      }
      if (resumeFile) {
        const url = await uploadResume();
        if (url) finalResumeUrl = url;
      }

      const updatedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');

      const response = await api.put(
        '/api/users/me',
        {
          bio,
          skills: updatedSkills,
          profilePictureUrl: finalProfilePictureUrl,
          resumeUrl: finalResumeUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (user && token) {
        login(response.data, token);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 id="edit-profile-title" className="text-2xl font-bold text-white">
            Edit Your Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close modal"
            type="button"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-md">
              {error}
            </div>
          )}

          {/* Profile Picture Upload */}
          <div>
            <label
              htmlFor="avatar-upload"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <img
                src={
                  avatarPreviewUrl ||
                  'https://placehold.co/150x150/1a202c/ffffff?text=Avatar'
                }
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center space-x-2"
              >
                <UploadCloud size={20} />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}</span>
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            {avatarFile && (
              <p className="text-sm text-gray-400 mt-2">Selected: {avatarFile.name}</p>
            )}
          </div>

          {/* Resume Upload */}
          <div>
            <label
              htmlFor="resume-upload"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Resume (PDF, DOC, DOCX)
            </label>
            <div className="flex items-center space-x-4">
              {resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline flex items-center space-x-2"
                >
                  <FileText size={20} />
                  <span>View Current Resume</span>
                </a>
              ) : (
                <p className="text-gray-400">No resume uploaded.</p>
              )}
              <label
                htmlFor="resume-upload"
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center space-x-2"
              >
                <UploadCloud size={20} />
                <span>{isUploadingResume ? 'Uploading...' : 'Upload New Resume'}</span>
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  onChange={handleResumeFileChange}
                  accept=".pdf,.doc,.docx"
                  disabled={isUploadingResume}
                />
              </label>
            </div>
            {resumeFile && (
              <p className="text-sm text-gray-400 mt-2">Selected: {resumeFile.name}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-300"
            >
              Bio
            </label>
            <textarea
              name="bio"
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              placeholder="Tell us about yourself (max 500 characters)"
            />
            <p className="text-xs text-gray-400 text-right">{bio.length}/500</p>
          </div>

          {/* Skills */}
          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-gray-300"
            >
              Skills (comma-separated)
            </label>
            <input
              type="text"
              name="skills"
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Acting, Voice Over, Screenwriting"
            />
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
              disabled={isSubmitting || isUploadingAvatar || isUploadingResume}
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

export default EditProfileModal;
