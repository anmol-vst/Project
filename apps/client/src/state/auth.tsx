import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/auth.service";
import { setHttpToken } from "../services/http";
import type { AppUser } from "../types/models";

type AuthContextType = {
  user: AppUser | null;
  token: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  signup: (name: string, email: string, password: string) => Promise<AppUser>;
  logout: () => void;
  refreshMe: () => Promise<AppUser>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY = "golfc_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const me = await authService.me();
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }

    setToken(saved);
    setHttpToken(saved);
    refreshMe()
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setHttpToken("");
        setToken("");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setHttpToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = await authService.signup({ name, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setHttpToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken("");
    setHttpToken("");
  };

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout, refreshMe }),
    [user, token, loading, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
