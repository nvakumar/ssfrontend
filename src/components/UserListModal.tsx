import React from 'react'; // Keep React import for JSX transform
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

// Define a type for a simplified user object for lists
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {isLoading ? (
            <p className="text-gray-400">Loading {title}...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : users.length > 0 ? (
            users.map(user => (
              <Link 
                to={`/profile/${user._id}`} 
                key={user._id} 
                onClick={onClose} // Close modal on click
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <img 
                  src={user.avatar || `https://placehold.co/50x50/1a202c/ffffff?text=${user.fullName.charAt(0)}`} 
                  alt={user.fullName} 
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
