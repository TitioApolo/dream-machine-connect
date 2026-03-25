import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken, getUser, setToken, setUser, clearToken, loginCliente, loginPessoa } from "@/lib/api";

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string, tipo: "cliente" | "pessoa") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = getToken();
    const savedUser = getUser();
    if (savedToken && savedUser) {
      setTokenState(savedToken);
      setUserState(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string, tipo: "cliente" | "pessoa") => {
    const fn = tipo === "cliente" ? loginCliente : loginPessoa;
    const data = await fn({ email, senha });

    console.log("[Auth] Token recebido:", data.token?.slice(0, 20) + "...");

    setToken(data.token);
    setUser({ email: data.email || email, name: data.name || "" });
    setTokenState(data.token);
    setUserState({ email: data.email || email, name: data.name || "" });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
