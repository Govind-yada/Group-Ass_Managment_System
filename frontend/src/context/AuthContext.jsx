import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('joineazy_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('joineazy_token'));
  const [loading, setLoading] = useState(true);

  // Synchronize user profile from backend on mount if token exists
  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('joineazy_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('joineazy_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Failed to verify session token:', err.message);
      // Handled by axios 401 interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { user: userData, token: jwtToken } = res.data;
      localStorage.setItem('joineazy_token', jwtToken);
      localStorage.setItem('joineazy_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const register = async ({ name, email, password, studentId }) => {
    const res = await api.post('/auth/register', { name, email, password, studentId });
    if (res.success && res.data) {
      const { user: userData, token: jwtToken } = res.data;
      localStorage.setItem('joineazy_token', jwtToken);
      localStorage.setItem('joineazy_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.message || 'Registration failed.');
  };

  const logout = () => {
    localStorage.removeItem('joineazy_token');
    localStorage.removeItem('joineazy_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updated) => {
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('joineazy_user', JSON.stringify(newUser));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isStudent: user?.role === 'STUDENT',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
