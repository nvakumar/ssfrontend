import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { XCircle, Loader2, MapPin, Search } from 'lucide-react';

// Define the shape of the User object we expect from the search API
interface SearchedUser {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
  location?: string;
}

// All possible roles (should match your backend userModel enum)
const allRoles = [
  'All Roles', 'Actor', 'Model', 'Filmmaker', 'Director', 'Writer',
  'Photographer', 'Editor', 'Musician', 'Creator', 'Student', 'Production House'
];

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // Initialize useNavigate hook
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'All Roles');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');

  const [results, setResults] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  // Memoized callback for fetching results
  const fetchResults = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setError('You must be logged in to search.');
      return;
    }
    
    // Allow search if query is not empty OR any filter is active
    if (!query.trim() && selectedRole === 'All Roles' && !locationFilter.trim()) { 
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      let queryString = `q=${encodeURIComponent(query.trim())}`;
      if (selectedRole !== 'All Roles') {
        queryString += `&role=${encodeURIComponent(selectedRole)}`;
      }
      if (locationFilter.trim()) {
        queryString += `&location=${encodeURIComponent(locationFilter.trim())}`;
      }

      const response = await api.get(`/api/users/search?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(response.data);
    } catch (err: any) {
      console.error("Failed to fetch search results:", err);
      setError(err.response?.data?.message || "Failed to load search results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedRole, locationFilter, token]); // Dependencies for useCallback

  // Effect to trigger search when search params change (e.g., from Header search)
  useEffect(() => {
    // Update local states based on URL search params
    setQuery(searchParams.get('q') || '');
    setSelectedRole(searchParams.get('role') || 'All Roles');
    setLocationFilter(searchParams.get('location') || '');
    
  }, [searchParams]); // Only depend on searchParams changing

  // Effect to run fetchResults when local state (query, selectedRole, locationFilter) changes
  useEffect(() => {
    fetchResults();
  }, [fetchResults]); // Depend on the memoized fetchResults


  // Function to handle search form submission (e.g., from Header or local form button)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams();
    if (query.trim()) newSearchParams.set('q', query.trim());
    if (selectedRole !== 'All Roles') newSearchParams.set('role', selectedRole);
    if (locationFilter.trim()) newSearchParams.set('location', locationFilter.trim());
    
    navigate(`/search?${newSearchParams.toString()}`); // Uses the initialized navigate
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Header />
      <main className="pt-16 flex-grow container mx-auto px-4 flex">
        <LeftSidebar />
        
        <div className="flex-grow p-4">
          <h1 className="text-3xl font-bold mb-6">Discover Talent</h1>

          {/* Search and Filter Controls */}
          <form onSubmit={handleSearchSubmit} className="bg-gray-800 p-6 rounded-lg mb-6 space-y-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, role, or keywords..."
                className="w-full p-3 pl-10 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Filter */}
              <div>
                <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-300 mb-1">Filter by Role</label>
                <select
                  id="roleFilter"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-3 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter (Placeholder for now) */}
              <div>
                <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-300 mb-1">Filter by Location</label>
                <div className="relative">
                  <input
                    type="text"
                    id="locationFilter"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="e.g., Hyderabad"
                    className="w-full p-3 pl-10 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  (Location filter requires backend implementation)
                </p>
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              Apply Filters
            </button>
          </form>

          {/* Search Results Display */}
          {isLoading ? (
            <p className="text-gray-400 flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin mr-2" /> Searching...</p>
          ) : error ? (
            <p className="text-red-400 flex items-center justify-center py-10"><XCircle size={16} className="mr-2"/> {error}</p>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((user) => (
                <Link to={`/profile/${user._id}`} key={user._id} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center space-y-3 hover:bg-gray-700 transition-colors">
                  <img 
                    src={user.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${user.fullName?.charAt(0) || 'U'}`} // Added safe navigation and default 'U'
                    alt={user.fullName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <p className="font-semibold text-lg text-white">{user.fullName}</p>
                    <p className="text-gray-400 text-sm">{user.role}</p>
                    {user.location && <p className="text-gray-500 text-xs flex items-center justify-center mt-1"><MapPin size={12} className="mr-1"/> {user.location}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">
              {query.trim() || selectedRole !== 'All Roles' || locationFilter.trim() ? `No users found matching your criteria. Try a different search.` : 'Start by searching for talent!'}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResultsPage;
