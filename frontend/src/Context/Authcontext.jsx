import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../Services/Auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // TEST MODE: If it's a fake token, just set a fake user
        if (token === 'fake-test-token-123') {
          setUser({
            name: 'Test User',
            email: 'test@example.com',
            phone: '+91 1234567890'
          });
        } else {
          // Real API call (when backend is ready)
          const userData = await authService.verifyToken(token);
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    // TEST MODE: Accept fake credentials directly
    if (credentials.user && credentials.token) {
      setUser(credentials.user);
      localStorage.setItem('token', credentials.token);
      return { user: credentials.user, token: credentials.token };
    }
    
    // Real API call (when backend is ready)
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    // TEST MODE: Accept fake signup directly
    const fakeUser = {
      name: userData.name || 'Test User',
      email: userData.email || 'test@example.com',
      phone: userData.phone || '+91 1234567890'
    };
    
    setUser(fakeUser);
    localStorage.setItem('token', 'fake-test-token-123');
    return { user: fakeUser, token: 'fake-test-token-123' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};