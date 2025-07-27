import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X } from 'lucide-react';

type CreateCastingCallModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const CreateCastingCallModal = ({ onClose, onSuccess }: CreateCastingCallModalProps) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectType: 'Feature Film',
    roleDescription: '',
    roleType: 'Lead',
    location: '',
    applicationDeadline: '',
    contactEmail: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/api/casting-calls', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create casting call:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          'Failed to create casting call. Please check the form and try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Post a New Casting Call</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-400 hover:text-white"
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

          {/* Form Fields */}
          <div>
            <label
              htmlFor="projectTitle"
              className="block text-sm font-medium text-gray-300"
            >
              Project Title
            </label>
            <input
              type="text"
              name="projectTitle"
              id="projectTitle"
              value={formData.projectTitle}
              onChange={handleChange}
              required
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="projectType"
              className="block text-sm font-medium text-gray-300"
            >
              Project Type
            </label>
            <select
              name="projectType"
              id="projectType"
              value={formData.projectType}
              onChange={handleChange}
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Feature Film</option>
              <option>Short Film</option>
              <option>Web Series</option>
              <option>Advertisement</option>
              <option>Theatre</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="roleDescription"
              className="block text-sm font-medium text-gray-300"
            >
              Role Description
            </label>
            <textarea
              name="roleDescription"
              id="roleDescription"
              value={formData.roleDescription}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div>
            <label
              htmlFor="roleType"
              className="block text-sm font-medium text-gray-300"
            >
              Role Type
            </label>
            <select
              name="roleType"
              id="roleType"
              value={formData.roleType}
              onChange={handleChange}
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Lead</option>
              <option>Supporting</option>
              <option>Cameo</option>
              <option>Background</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-300"
              >
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="applicationDeadline"
                className="block text-sm font-medium text-gray-300"
              >
                Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                id="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
                required
                className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-gray-300"
            >
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              id="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              disabled={isSubmitting}
              className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500"
            >
              {isSubmitting ? 'Posting...' : 'Post Casting Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCastingCallModal;
