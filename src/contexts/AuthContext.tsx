import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getToken,
  getUser,
  setToken,
  setUser,
  clearToken,
  loginCliente,
  loginPessoa,
  setAuthTipo,
  getAuthTipo,
  type LoginTipo,
} from "@/lib/api";

interface User {
  email: string;
  name: string;
  tipo: LoginTipo;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string, tipo: LoginTipo) => Promise<void>;
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
    const savedTipo = getAuthTipo();

    if (savedToken && savedUser && savedTipo) {
      setTokenState(savedToken);
      setUserState({
        email: savedUser.email,
        name: savedUser.name,
        tipo: savedUser.tipo ?? savedTipo,
      });
      console.log("[Auth] Sessão restaurada com token:", `${savedToken.slice(0, 24)}...`);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string, tipo: LoginTipo) => {
    const fn = tipo === "cliente" ? loginCliente : loginPessoa;
    const data = await fn({ email, senha });

    const tokenRecebido = typeof data.token === "string" ? data.token : "";
    if (!tokenRecebido) {
      throw new Error("Login retornou sem token JWT válido.");
    }

    console.log("[Auth] Tipo de login:", tipo);
    console.log("[Auth] Token recebido:", `${tokenRecebido.slice(0, 24)}...`);

    const userData: User = {
      email: (data.email as string) || email,
      name: (data.name as string) || "",
      tipo,
    };

    setToken(tokenRecebido);
    setAuthTipo(tipo);
    setUser(userData);

    setTokenState(tokenRecebido);
    setUserState(userData);
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
