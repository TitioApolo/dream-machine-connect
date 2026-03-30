const API_BASE = "https://dreams-machine-7e6a3c0a6e6e.herokuapp.com";

export type LoginTipo = "cliente" | "pessoa";

export function getToken(): string | null {
  const token = localStorage.getItem("token");
  console.log("[TOKEN] Recuperado do localStorage:", token ? `${token.slice(0, 24)}...` : "NULO/VAZIO");
  return token;
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
  console.log("[TOKEN] Salvo no localStorage:", token ? `${token.slice(0, 24)}...` : "VAZIO");
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("auth_tipo");
  localStorage.removeItem("userType");
  localStorage.removeItem("userId");
}

export function getAuthTipo(): LoginTipo | null {
  const tipo = localStorage.getItem("auth_tipo");
  if (tipo === "cliente" || tipo === "pessoa") return tipo;
  return null;
}

export function setAuthTipo(tipo: LoginTipo) {
  localStorage.setItem("auth_tipo", tipo);
}

export function getUser(): { email: string; name: string; tipo?: LoginTipo } | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user: { email: string; name: string; tipo?: LoginTipo }) {
  localStorage.setItem("user", JSON.stringify(user));
}

interface LoginPayload {
  email: string;
  senha: string;
}

interface LoginResponse {
  token?: string;
  email?: string;
  name?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

async function doLogin(path: "/login-cliente" | "/login-pessoa", payload: LoginPayload) {
  const url = `${API_BASE}${path}`;
  console.log("[AUTH] POST", url);
  console.log("[AUTH] Body:", { email: payload.email, senha: "***" });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await parseResponse(res)) as LoginResponse;
  console.log("[AUTH] Response status:", res.status);
  console.log("[AUTH] Response body:", data);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Erro ao fazer login");
  }

  if (!data?.token || typeof data.token !== "string") {
    throw new Error("Token JWT inválido ou ausente na resposta do login.");
  }

  return data;
}

export async function loginCliente(payload: LoginPayload) {
  return doLogin("/login-cliente", payload);
}

export async function loginPessoa(payload: LoginPayload) {
  return doLogin("/login-pessoa", payload);
}

export function getUserType(): string | null {
  return localStorage.getItem("userType");
}

export function getUserId(): string | null {
  return localStorage.getItem("userId");
}

export function isAdmin(): boolean {
  return getUserType() === "ADMIN";
}

function buildAuthHeaders(token: string, headers?: HeadersInit): HeadersInit {
  // Tenta primeiro com x-access-token (pode ser o que o backend espera)
  // Se não funcionar, o backend retornará 401 e tentaremos outro formato
  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    "x-access-token": token,
    ...headers,
  };
  
  // Log completo do header enviado
  console.log("[HEADERS] x-access-token:", token ? `${token.slice(0, 24)}...` : "VAZIO");
  console.log("[HEADERS] Token length:", token ? token.length : 0);
  console.log("[HEADERS] Token valid format:", token && token.startsWith("eyJ") ? "JWT format" : "UNKNOWN");
  
  return finalHeaders;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE}${path}`;

  console.log("[API] URL:", url);
  console.log("[API] Token:", token ? `${token.slice(0, 24)}...` : "MISSING");
  console.log("[API] User Type:", getUserType());
  console.log("[API] User ID:", getUserId());

  if (!token || token.trim().length === 0) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  // Tentar com x-access-token (primeira tentativa)
  let headers = buildAuthHeaders(token, options.headers);
  
  let res = await fetch(url, {
    ...options,
    headers,
  });

  let rawData = await parseResponse(res);
  console.log("[API] Status:", res.status);
  console.log("[API] Response:", rawData);
  
  // Se 401 com x-access-token, tentar com Authorization Bearer
  if (res.status === 401) {
    console.warn("[API] 401 com x-access-token, tentando Authorization: Bearer...");
    
    headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    };
    
    res = await fetch(url, {
      ...options,
      headers,
    });
    
    rawData = await parseResponse(res);
    console.log("[API] Retry Status:", res.status);
    console.log("[API] Retry Response:", rawData);
  }
  
  // Se ainda 401, tentar sem header de auth (talvez o backend use query param)
  if (res.status === 401 && url.includes("?") === false) {
    console.warn("[API] 401 com Authorization, tentando token em query param...");
    
    headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    
    const urlWithToken = url.includes("?") 
      ? `${url}&token=${token}`
      : `${url}?token=${token}`;
    
    res = await fetch(urlWithToken, {
      ...options,
      headers,
    });
    
    rawData = await parseResponse(res);
    console.log("[API] Query Param Status:", res.status);
    console.log("[API] Query Param Response:", rawData);
  }
  
  // Log detalhado da resposta para debug
  if (!res.ok) {
    console.error("[API] Erro completo:", {
      status: res.status,
      statusText: res.statusText,
      responseBody: rawData,
      url: url,
      headers: Object.fromEntries(res.headers.entries()),
    });
  }

  if (!res.ok) {
    const errorMessage =
      typeof rawData === "object" && rawData !== null
        ? ((rawData as { error?: string; message?: string }).error ||
           (rawData as { error?: string; message?: string }).message)
        : undefined;

    if (res.status === 401) {
      console.error("[401 ERROR] Token inválido!", {
        token: token ? `${token.slice(0, 24)}...` : "NULO",
        tokenLength: token ? token.length : 0,
        tokenFormat: token && token.startsWith("eyJ") ? "JWT" : "UNKNOWN",
        userType: getUserType(),
        userId: getUserId(),
        url,
        errorMessage,
      });
      throw new Error(errorMessage || "401 Unauthorized: token inválido, expirado ou sem permissão.");
    }

    throw new Error(errorMessage || `Erro ${res.status} em ${path}`);
  }

  return rawData as T;
}

export async function apiFetchFirst<T = unknown>(paths: string[], options: RequestInit = {}): Promise<T> {
  let lastError: Error | null = null;

  for (const path of paths) {
    try {
      return await apiFetch<T>(path, options);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Erro desconhecido");
      lastError = err;
      console.warn(`[API] Falha em ${path}:`, err.message);
    }
  }

  throw lastError ?? new Error("Nenhuma rota disponível para esta requisição.");
}
