import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // Your backend server URL
});

export default api;
// import axios from 'axios';

// // Use an environment variable for the backend URL.
// // In development, this will be 'http://localhost:5000' (or 5001).
// // In production (on Vercel), you will set VITE_BACKEND_URL to your Render backend URL.
// const api = axios.create({
//   baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', // Default to local for dev
// });

// export default api;
