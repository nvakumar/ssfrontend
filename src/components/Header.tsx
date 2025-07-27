import { useState, useEffect, useRef } from 'react';
import { Search, Bell, MessageSquare, User } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

const Header = () => {
  const [query, setQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${query.trim()}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close notifications dropdown on route change
  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side: Logo */}
        <Link
          to="/feed"
          className="text-2xl font-bold text-white hover:text-indigo-400 transition-colors"
        >
          StageScout
        </Link>

        {/* Center: Search Bar Form */}
        <div className="w-full max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by role, name, or location..."
              className="w-full p-2 pl-10 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Search"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </form>
        </div>

        {/* Right Side: Icons */}
        <div className="flex items-center space-x-4">
          {/* Notifications Bell Icon with Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-gray-700"
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="text-gray-300" />
            </button>
            {showNotifications && <NotificationsDropdown />}
          </div>

          {/* Messages Icon */}
          <Link
            to="/messages"
            className="p-2 rounded-full hover:bg-gray-700 block"
            title="Messages"
            aria-label="Messages"
          >
            <MessageSquare className="text-gray-300" />
          </Link>

          {/* User Profile Icon */}
          <Link
            to={user ? `/profile/${user._id}` : '/login'}
            className="p-2 rounded-full hover:bg-gray-700 block"
            title="My Profile"
            aria-label="My Profile"
          >
            <User className="text-gray-300" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
