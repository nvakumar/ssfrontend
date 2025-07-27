// src/pages/SearchResultsPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

// Define the shape of the User object we expect from the search API
interface SearchedUser {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
}

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q'); // Get the search query from the URL (?q=...)
  
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || !token) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/users/search?q=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(response.data);
      } catch (err) {
        console.error("Failed to fetch search results:", err);
        setError("Failed to load search results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, token]); // Re-fetch when the query or token changes

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Header />
      <main className="pt-20 container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">
          Search Results for: <span className="text-indigo-400">"{query}"</span>
        </h1>

        {isLoading ? (
          <p>Searching...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((user) => (
              <Link to={`/profile/${user._id}`} key={user._id} className="bg-gray-800 p-4 rounded-lg flex items-center space-x-4 hover:bg-gray-700 transition-colors">
                <img 
                  src={user.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${user.fullName.charAt(0)}`} 
                  alt={user.fullName}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold text-lg">{user.fullName}</p>
                  <p className="text-gray-400">{user.role}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>No users found matching your search.</p>
        )}
      </main>
    </div>
  );
};

export default SearchResultsPage;
