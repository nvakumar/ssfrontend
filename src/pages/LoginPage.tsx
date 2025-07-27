// src/pages/LoginPage.tsx
import { useState } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom'; // 👈 Import useNavigate
import { useAuth } from '../context/AuthContext'; // 👈 Import our custom auth hook

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // 👈 Get the navigate function
  const { login } = useAuth(); // 👈 Get the login function from our context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });
      
      // 👇 Use the login function from context to save user data
      login(response.data, response.data.token);

      // 👇 Redirect to the feed page on success
      navigate('/feed');

    } catch (err: any) {
      console.error('Login failed:', err);
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-gray-400">Sign in to your Stage Scout account</p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-md" role="alert">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="text-sm font-bold text-gray-400">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mt-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {/* Password Input */}
          <div>
            <label htmlFor="password" className="text-sm font-bold text-gray-400">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mt-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full p-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              Sign In
            </button>
          </div>
        </form>
        {/* Link to Register */}
        <div className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-500">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
