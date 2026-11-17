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

const CACHED_USER_KEY = 'criv_cached_user';

function normalizeAuthUser(profile: any, fallbackGoal = 20, fallbackIsDemo = false): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    dailyReviewGoal: profile.dailyReviewGoal ?? fallbackGoal,
    currentStreak: profile.currentStreak ?? 0,
    longestStreak: profile.longestStreak ?? 0,
    isDemo: Boolean(profile.isDemo ?? fallbackIsDemo),
  };
}

function readCachedUser(): AuthUser | null {
  if (!getAuthToken()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return normalizeAuthUser(parsed);
    }
  } catch {
    // Ignore malformed cached user profile
  }
  return null;
}

function persistCachedUser(nextUser: AuthUser | null): void {
  try {
    if (nextUser) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialCachedUser] = useState<AuthUser | null>(() => readCachedUser());
  const [user, setUser] = useState<AuthUser | null>(initialCachedUser);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => Boolean(getAuthToken()) && !initialCachedUser
  );
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('criv_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const applyAuthenticatedUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    persistCachedUser(nextUser);
  }, []);

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
      applyAuthenticatedUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res: any = await api.auth.me();
      const profile = res?.data || res;
      if (profile?.id) {
        applyAuthenticatedUser(normalizeAuthUser(profile));
      } else {
        setAuthToken(null);
        applyAuthenticatedUser(null);
      }
    } catch {
      setAuthToken(null);
      applyAuthenticatedUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthenticatedUser]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res: any = await api.auth.login({ email, password });
    const data = res?.data || res;
    if (data?.token && data?.user) {
      setAuthToken(data.token);
      applyAuthenticatedUser(normalizeAuthUser(data.user));
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
      applyAuthenticatedUser(
        normalizeAuthUser(data.user, payload.dailyReviewGoal ?? 20, false)
      );
    } else {
      throw new Error('Invalid registration response.');
    }
  };

  const loginAsDemo = async () => {
    const res: any = await api.auth.demoLogin();
    const data = res?.data || res;
    if (data?.token && data?.user) {
      setAuthToken(data.token);
      applyAuthenticatedUser({
        ...normalizeAuthUser(data.user, 20, true),
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
    const updatedUser = normalizeAuthUser(data);
    applyAuthenticatedUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    setAuthToken(null);
    applyAuthenticatedUser(null);
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
