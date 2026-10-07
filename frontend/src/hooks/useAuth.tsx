import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { apiRequest, clearTokens, getAccessToken, setTokens } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    first_name: string;
    last_name: string;
    group: string;
    email: string;
    password: string;
  }) => Promise<User>;
  acceptRules: () => Promise<User>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await apiRequest<User>('/auth/me/');
      setUser(me);
      return me;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    const handleUnauth = () => {
      setUser(null);
    };
    window.addEventListener('sarvinoz:unauthorized', handleUnauth);
    return () => window.removeEventListener('sarvinoz:unauthorized', handleUnauth);
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ user: User; tokens: { access: string; refresh: string } }>(
      '/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    setTokens(res.tokens.access, res.tokens.refresh);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: {
    first_name: string;
    last_name: string;
    group: string;
    email: string;
    password: string;
  }): Promise<User> => {
    const res = await apiRequest<{ user: User; tokens: { access: string; refresh: string } }>(
      '/auth/register/',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setTokens(res.tokens.access, res.tokens.refresh);
    setUser(res.user);
    return res.user;
  };

  const acceptRules = async (): Promise<User> => {
    const res = await apiRequest<{ user: User }>('/auth/accept-rules/', {
      method: 'POST',
      body: JSON.stringify({ accepted: true }),
    });
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, acceptRules, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
