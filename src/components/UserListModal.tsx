<<<<<<< HEAD
import { useEffect } from 'react';
=======
>>>>>>> fa3c2a3 (refactor: remove default React import, use hooks-only imports in all components and pages)
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface SimpleUser {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: SimpleUser[];
  isLoading: boolean;
  error: string;
}

const UserListModal = ({ isOpen, onClose, title, users, isLoading, error }: UserListModalProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-list-modal-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 id="user-list-modal-title" className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal" type="button">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {isLoading ? (
            <p className="text-gray-400">Loading {title}...</p>
          ) : error ? (
            <p className="text-red-400" role="alert">{error}</p>
          ) : users.length > 0 ? (
            users.map(user => (
              <Link
                key={user._id}
                to={`/profile/${user._id}`}
                onClick={onClose}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <img
                  src={user.avatar || `https://placehold.co/50x50/1a202c/ffffff?text=${user.fullName?.charAt(0) ?? 'U'}`}
                  alt={user.fullName || 'User avatar'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-white">{user.fullName}</p>
                  <p className="text-sm text-gray-400">{user.role}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-400">No {title.toLowerCase()} found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
