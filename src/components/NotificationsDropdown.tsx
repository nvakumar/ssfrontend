import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Bell, Briefcase, XCircle } from 'lucide-react';

interface Notification {
  _id: string;
  applicant: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  castingCall: {
    _id: string;
    projectTitle: string;
    roleType: string;
  };
  type: 'application';
  status: 'read' | 'unread';
  createdAt: string;
}

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) {
        setError('Not authenticated.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await api.get('/api/casting-calls/notifications', { 
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
      } catch (err: unknown) {
        console.error("Failed to fetch notifications:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load notifications.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  return (
    <div 
      role="list" 
      aria-label="Notifications list"
      className="absolute top-14 right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg py-2 z-20 border border-gray-700 max-h-96 overflow-y-auto"
    >
      <div className="px-4 py-2 text-lg font-bold text-white border-b border-gray-700">Notifications</div>

      {isLoading ? (
        <p className="p-4 text-gray-400">Loading...</p>
      ) : error ? (
        <p className="p-4 text-red-400 flex items-center" role="alert">
          <XCircle size={16} className="mr-2" /> {error}
        </p>
      ) : notifications.length > 0 ? (
        notifications.map((notif) => (
          <Link 
            key={notif._id}
            role="listitem"
            to={`/profile/${notif.applicant._id}`} 
            className={`flex items-start space-x-3 px-4 py-3 hover:bg-gray-700/50 transition-colors duration-150 border-b border-gray-700 last:border-b-0 ${
              notif.status === 'unread' ? 'bg-indigo-900/20' : ''
            }`}
          >
            <img 
              src={notif.applicant.avatar || `https://placehold.co/50x50/1a202c/ffffff?text=${notif.applicant.fullName.charAt(0)}`} 
              alt={notif.applicant.fullName} 
              className="w-10 h-10 rounded-full object-cover flex-shrink-0" 
            />
            <div>
              <p className="text-sm text-gray-300">
                <span className="font-bold text-white">{notif.applicant.fullName}</span> applied to your casting call for the{' '}
                <span className="font-bold text-indigo-400">{notif.castingCall.roleType}</span>
                {' '} role in{' '}
                <span className="font-bold text-indigo-400">"{notif.castingCall.projectTitle}"</span>.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notif.createdAt).toLocaleString()}
              </p>
            </div>
          </Link>
        ))
      ) : (
        <p className="p-4 text-gray-400">No new notifications.</p>
      )}

      <Link 
        to="/notifications" 
        className="block text-center py-2 text-sm text-indigo-400 hover:text-indigo-300 border-t border-gray-700"
      >
        View All Notifications
      </Link>
    </div>
  );
};

export default NotificationsDropdown;
