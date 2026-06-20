'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, AuthUser } from '@/lib/api';

type LoginResponse = {
  requiresMfa: boolean;
  challengeId: string;
  demoCode?: string;
};

type ConfirmMfaResponse = {
  accessToken: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  confirmMfa: (challengeId: string, code: string) => Promise<AuthUser>;
  setSession: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'smartlegis.token';
const USER_KEY = 'smartlegis.user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedToken = window.localStorage.getItem(TOKEN_KEY);
      const storedUser = window.localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
      }
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isReady,
    login: (email, password) =>
      apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    confirmMfa: async (challengeId, code) => {
      const response = await apiRequest<ConfirmMfaResponse>('/api/auth/mfa/confirm', {
        method: 'POST',
        body: JSON.stringify({ challengeId, code })
      });
      setToken(response.accessToken);
      setUser(response.user);
      window.localStorage.setItem(TOKEN_KEY, response.accessToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return response.user;
    },
    setSession: (accessToken, nextUser) => {
      setToken(accessToken);
      setUser(nextUser);
      window.localStorage.setItem(TOKEN_KEY, accessToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    },
    logout: () => {
      setToken(null);
      setUser(null);
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
  }), [isReady, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
