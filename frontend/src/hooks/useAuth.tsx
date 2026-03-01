import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService, AuthUser } from "../services/auth.service";
import { authStorage, getErrorMessage } from "../services/api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // On app boot: if a token exists, validate by loading profile.
  useEffect(() => {
    const boot = async () => {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const result = await authService.profile();
        setUser(result.user);
        setToken(storedToken);
      } catch (err) {
        authStorage.clearToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await authService.login(email, password);
      authStorage.setToken(result.token);
      setToken(result.token);
      setUser(result.user);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const logout = () => {
    authStorage.clearToken();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, error, login, logout }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
