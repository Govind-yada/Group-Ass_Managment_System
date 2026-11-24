import axios from 'axios';

const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim() : '';

  // Handle case where Render injects internal service name without domain (e.g. 'joineazy-backend-n8ep')
  if (url && !url.includes('.') && !url.includes('localhost')) {
    url = `https://${url}.onrender.com/api`;
  } else if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    url = url.endsWith('/api') ? url : `${url.replace(/\/+$/, '')}/api`;
  }

  if (url) return url;

  // Fallback when hosted on Render
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://joineazy-backend-n8ep.onrender.com/api';
  }

  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('joineazy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthRequest) {
        localStorage.removeItem('joineazy_token');
        localStorage.removeItem('joineazy_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
