import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import all pages
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import FeedPage from './pages/FeedPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import SearchResultsPage from './pages/SearchResultsPage.tsx';
import CastingCallsPage from './pages/CastingCallsPage.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';
import GroupsPage from './pages/GroupsPage.tsx';
import GroupDetailPage from './pages/GroupDetailPage.tsx';
import MessagesPage from './pages/MessagesPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx'; // Import the SettingsPage

// Import components
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Import CSS
import './output.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes that everyone can see */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes that only logged-in users can see */}
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/casting-calls" element={<CastingCallsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/settings" element={<SettingsPage />} /> {/* Add the SettingsPage route */}
          </Route>
          
          {/* Default route redirects to login */}
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
