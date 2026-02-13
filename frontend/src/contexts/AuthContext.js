import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const logError = (...args) => {
  console.error('[AuthContext ERROR]', ...args);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user profile data when token exists
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('users/me');
      const userData = response.data;
      if (!userData || userData.user === null) {
        // User not found in DB - stale token
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        return;
      }
      setUser({ ...userData, token: localStorage.getItem('token'), isAuthenticated: true });
    } catch (error) {
      // Token might be invalid or user not found - clear it silently
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    try {
      const trimmedInput = (emailOrUsername || '').trim();
      if (!trimmedInput || !password) {
        return { success: false, error: 'Username/email and password are required' };
      }

      // Determine if input is email or username
      const isEmail = /^\S+@\S+\.\S+$/.test(trimmedInput);
      const requestBody = isEmail
        ? { email: trimmedInput, password }
        : { username: trimmedInput, password };

      const response = await api.post('auth/login', requestBody);
      
      // Check if 2FA is required
      if (response.data.requires2FA) {
        return { 
          success: false, 
          requires2FA: true, 
          tempUserId: response.data.tempUserId 
        };
      }
      
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const userState = { ...userData, token };
      setUser(userState);
      
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      logError('Login failed:', { status: error.response?.status, message: errorMsg });
      return { 
        success: false, 
        error: errorMsg
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const trimmedUsername = (username || '').trim();
      const trimmedEmail = (email || '').trim();
      if (!trimmedUsername || trimmedUsername.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (!password || password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      const response = await api.post('auth/register', {
        username: trimmedUsername,
        email: trimmedEmail,
        password
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      logError('Registration failed:', { status: error.response?.status, message: errorMsg });
      return { 
        success: false, 
        error: errorMsg
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const googleSignIn = async (googleToken) => {
    try {
      if (!googleToken) {
        logError('No Google token provided');
        return { success: false, error: 'No Google token provided' };
      }
      
      const response = await api.post('auth/google', {
        token: googleToken,
        deviceId: 'web-browser-' + Date.now() // Simple device ID
      });
      
      const { token, user: userData } = response.data;
      
      if (!token) {
        logError('No token in Google auth response:', response.data);
        return { success: false, error: 'No authentication token received' };
      }
      
      // Store token and set auth header
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const userState = { ...userData, token };
      setUser(userState);
      
      return { success: true, user: userState };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      logError('Google sign-in failed:', { 
        status: error.response?.status, 
        message: errorMsg,
        fullError: error.response?.data 
      });
      return { 
        success: false, 
        error: errorMsg || 'Google sign-in failed'
      };
    }
  };

  const value = {
    user,
    login,
    register,
    googleSignIn,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};