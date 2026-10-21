import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem('rm_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      localStorage.removeItem('rm_user');
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session: validates via authService.getMe() (works with Bearer or HttpOnly cookie)
  useEffect(() => {
    authService.getMe()
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem('rm_user', JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem('rm_token');
        localStorage.removeItem('rm_user');
        setCurrentUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    const data = await authService.login({ email, password });
    if (data.token) {
      localStorage.setItem('rm_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('rm_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async ({ name, email, password, confirmPassword }) => {
    setError(null);
    const data = await authService.register({ name, email, password, confirmPassword });
    if (data.token) {
      localStorage.setItem('rm_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('rm_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getMe();
      setCurrentUser(user);
      localStorage.setItem('rm_user', JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('rm_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAuthenticated = Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
