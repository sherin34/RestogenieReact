import axios from 'axios';
import { getToken } from '../utils/auth';

// Create Axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle subscription expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      const data = error.response.data;
      const code = typeof data === 'object' ? data.code : null;
      if (code === 'SUBSCRIPTION_EXPIRED' || code === 'NO_SUBSCRIPTION') {
        // Redirect to admin page where subscription management is located
        window.location.href = '/admin?tab=subscription';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
