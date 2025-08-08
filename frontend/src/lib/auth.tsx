'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  roles: string[];
  username?: string;
  subscription?: string;
};

type AuthCtx = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (r: 'payer'|'worker') => boolean;
};

const AuthContext = createContext<AuthCtx>({
  token: null, user: null, login: () => {}, logout: () => {}, hasRole: () => false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string|null>(null);
  const [user, setUser] = useState<User|null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
  }, []);

  const login = (tk: string, u: User) => {
    setToken(tk); setUser(u);
    localStorage.setItem('token', tk);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('token'); localStorage.removeItem('user');
  };

  const hasRole = (r: 'payer'|'worker') => !!user?.roles?.includes(r);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
