import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Users,
  Briefcase,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LeftSidebar = () => {
  const { user, logout } = useAuth();

  const userAvatar = user?.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${user?.fullName?.charAt(0) ?? 'U'}`;

  return (
    <aside className="w-64 p-4 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="space-y-6">
        {/* User Profile Snippet */}
        {user && (
          <Link
            to={`/profile/${user._id}`}
            className="flex flex-col items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            aria-label={`View profile of ${user.fullName}`}
          >
            <img
              src={userAvatar}
              alt={user.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500"
            />
            <p className="font-semibold text-white mt-3 text-lg">{user.fullName}</p>
            <p className="text-sm text-gray-400">{user.role}</p>
          </Link>
        )}

        {/* Main Navigation */}
        <nav className="space-y-2">
          <NavLink
            to="/feed"
            aria-label="Home"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Home size={20} /> <span>Home</span>
          </NavLink>

          <NavLink
            to="/casting-calls"
            aria-label="Casting Calls"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Briefcase size={20} /> <span>Casting Calls</span>
          </NavLink>

          <NavLink
            to="/messages"
            aria-label="Messages"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <MessageSquare size={20} /> <span>Messages</span>
          </NavLink>

          <NavLink
            to="/groups"
            aria-label="Groups"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Users size={20} /> <span>Groups</span>
          </NavLink>

          {/* Removed Discover NavLink as per earlier request */}
          {/* <NavLink 
            to="/search" 
            className={({ isActive }: { isActive: boolean }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Search size={20} /> <span>Discover</span>
          </NavLink> */}
          {/* Removed Leaderboard NavLink as per earlier request */}
          {/* <NavLink 
            to="/leaderboard" 
            className={({ isActive }: { isActive: boolean }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Award size={20} /> <span>Leaderboard</span>
          </NavLink> */}
          {/* Settings NavLink */}
          <NavLink 
            to="/settings" 
            className={({ isActive }: { isActive: boolean }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Settings size={20} /> <span>Settings</span>
          </NavLink>
        </nav>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center space-x-3 p-3 rounded-lg bg-gray-700 text-red-400 hover:bg-red-900/50 transition-colors duration-200 mt-6"
          aria-label="Logout"
        >
          <LogOut size={20} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;
