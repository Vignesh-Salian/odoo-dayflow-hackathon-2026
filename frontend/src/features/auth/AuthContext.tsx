import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "../../api/auth.ts";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  signup: (payload: {
    companyName: string;
    country?: string;
    adminFirstName: string;
    adminLastName: string;
    email: string;
    password: string;
    logo?: File | null;
  }) => Promise<AuthUser>;
  logout: () => void;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function persistTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("dayflow_access_token", accessToken);
  localStorage.setItem("dayflow_refresh_token", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("dayflow_access_token");
  localStorage.removeItem("dayflow_refresh_token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((accessToken: string, refreshToken: string, next: AuthUser) => {
    persistTokens(accessToken, refreshToken);
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem("dayflow_access_token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.data);
    } catch {
      const refresh = localStorage.getItem("dayflow_refresh_token");
      if (!refresh) {
        clearTokens();
        setUser(null);
        return;
      }
      try {
        const { data } = await authApi.refresh(refresh);
        setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
      } catch {
        clearTokens();
        setUser(null);
      }
    }
  }, [setSession]);

  useEffect(() => {
    void (async () => {
      await refreshMe();
      setIsLoading(false);
    })();
  }, [refreshMe]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const { data } = await authApi.login(identifier, password);
      setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
      return data.data.user;
    },
    [setSession],
  );

  const signup = useCallback(
    async (payload: {
      companyName: string;
      country?: string;
      adminFirstName: string;
      adminLastName: string;
      email: string;
      password: string;
      logo?: File | null;
    }) => {
      const { data } = await authApi.companySignup(payload);
      setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
      return data.data.user;
    },
    [setSession],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      setSession,
      refreshMe,
    }),
    [user, isLoading, login, signup, logout, setSession, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
