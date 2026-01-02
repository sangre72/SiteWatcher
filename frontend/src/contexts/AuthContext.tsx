import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth';
import * as authApi from '../lib/authApi';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest) => {
    const loggedInUser = await authApi.login(credentials);
    setUser(loggedInUser);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    register,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
