import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dayflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dayflow_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await AuthAPI.getMe();
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('dayflow_user', JSON.stringify(res.data));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = (tokenData) => {
    setToken(tokenData.access_token);
    setUser(tokenData);
    localStorage.setItem('dayflow_token', tokenData.access_token);
    localStorage.setItem('dayflow_user', JSON.stringify(tokenData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
