import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { Bell, Briefcase } from 'lucide-react'; // Icons for notification types

// Define the shape of the Notification data we expect from the API
interface Applicant {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
}

interface CastingCallDetails {
  _id: string;
  projectTitle: string;
  projectType: string;
  roleType: string;
}

interface Notification {
  _id: string;
  applicant: Applicant;
  recipient: string; // The ID of the user who received the notification
  castingCall: CastingCallDetails;
  type: 'application'; // For now, only 'application' type
  status: 'unread' | 'read';
  createdAt: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) {
        setIsLoading(false);
        setError('You must be logged in to view notifications.');
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get('/api/casting-calls/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
      } catch (err: any) {
        console.error("Failed to fetch notifications:", err);
        setError(err.response?.data?.message || "Failed to load notifications. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, [token]);

  // Helper function to render notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Briefcase size={20} className="text-indigo-400" />;
      default:
        return <Bell size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Header />
      <main className="pt-16 container mx-auto px-4">
        <div className="flex">
          <LeftSidebar />
          <div className="flex-grow p-4">
            <h1 className="text-3xl font-bold mb-6">Your Notifications</h1>

            {isLoading ? (
              <p>Loading notifications...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div key={notification._id} className="bg-gray-800 p-4 rounded-lg flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-300 text-sm">
                        <span className="font-semibold text-white">
                          <a href={`/profile/${notification.applicant._id}`} className="hover:underline">
                            {notification.applicant.fullName}
                          </a>
                        </span> ({notification.applicant.role}) applied to your{' '}
                        <span className="font-semibold text-indigo-400">
                          {notification.castingCall.projectTitle}
                        </span> ({notification.castingCall.roleType} role).
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {/* Add action buttons here later, e.g., "View Application" */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400">You have no new notifications.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
