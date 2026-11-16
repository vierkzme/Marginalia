import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getAuthToken, setAuthToken } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  dailyReviewGoal: number;
  currentStreak: number;
  longestStreak: number;
  isDemo?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDark: boolean;
  setThemeDark: (dark: boolean) => void;
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    dailyReviewGoal?: number;
  }) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  updateProfile: (payload: {
    fullName?: string;
    dailyReviewGoal?: number;
    newPassword?: string;
  }) => Promise<AuthUser>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('criv_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('criv_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('criv_theme', 'light');
    }
  }, [isDark]);

  const refreshProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res: any = await api.auth.me();
      const profile = res?.data || res;
      if (profile?.id) {
        setUser({
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          dailyReviewGoal: profile.dailyReviewGoal ?? 20,
          currentStreak: profile.currentStreak ?? 0,
          longestStreak: profile.longestStreak ?? 0,
          isDemo: Boolean(profile.isDemo),
        });
      } else {
        setAuthToken(null);
        setUser(null);
      }
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res: any = await api.auth.login({ email, password });
    const data = res?.data || res;
    if (data?.token && data?.user) {
      setAuthToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        dailyReviewGoal: data.user.dailyReviewGoal ?? 20,
        currentStreak: data.user.currentStreak ?? 0,
        longestStreak: data.user.longestStreak ?? 0,
        isDemo: Boolean(data.user.isDemo),
      });
    } else {
      throw new Error('Invalid authentication response.');
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    fullName: string;
    dailyReviewGoal?: number;
  }) => {
    const res: any = await api.auth.register(payload);
    const data = res?.data || res;
    if (data?.token && data?.user) {
      setAuthToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        dailyReviewGoal: data.user.dailyReviewGoal ?? payload.dailyReviewGoal ?? 20,
        currentStreak: data.user.currentStreak ?? 0,
        longestStreak: data.user.longestStreak ?? 0,
        isDemo: false,
      });
    } else {
      throw new Error('Invalid registration response.');
    }
  };

  const loginAsDemo = async () => {
    const res: any = await api.auth.demoLogin();
    const data = res?.data || res;
    if (data?.token && data?.user) {
      setAuthToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        dailyReviewGoal: data.user.dailyReviewGoal ?? 20,
        currentStreak: data.user.currentStreak ?? 14,
        longestStreak: data.user.longestStreak ?? 29,
        isDemo: true,
      });
    } else {
      throw new Error('Unable to start demo session.');
    }
  };

  const updateProfile = async (payload: {
    fullName?: string;
    dailyReviewGoal?: number;
    newPassword?: string;
  }): Promise<AuthUser> => {
    const res: any = await api.auth.updateProfile(payload);
    const data = res?.data || res;
    const updatedUser: AuthUser = {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      dailyReviewGoal: data.dailyReviewGoal ?? 20,
      currentStreak: data.currentStreak ?? 0,
      longestStreak: data.longestStreak ?? 0,
      isDemo: Boolean(data.isDemo),
    };
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isDark,
        setThemeDark: setIsDark,
        toggleTheme,
        login,
        register,
        loginAsDemo,
        updateProfile,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
