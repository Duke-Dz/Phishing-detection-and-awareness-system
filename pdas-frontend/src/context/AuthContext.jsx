import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Hydrate session on mount — check localStorage for existing tokens
  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authService.getMe();
        setUser(response.data);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem("access_token", response.token);
    localStorage.setItem("refresh_token", response.refreshToken);
    setUser(response.data);
    return response;
  }, []);

  const register = useCallback(async (data) => {
    const response = await authService.register(data);
    return response;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;
    try {
      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem("access_token", response.token);
      localStorage.setItem("refresh_token", response.refreshToken);
      setUser(response.data);
      return response;
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, loading, isAuthenticated, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
