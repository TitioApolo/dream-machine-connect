const API_BASE = "https://dreams-machine-7e6a3c0a6e6e.herokuapp.com";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser(): { email: string; name: string } | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user: { email: string; name: string }) {
  localStorage.setItem("user", JSON.stringify(user));
}

interface LoginPayload {
  email: string;
  senha: string;
}

export async function loginCliente(payload: LoginPayload) {
  const url = `${API_BASE}/login-cliente`;
  console.log("[API] POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("[API] Login response:", data);

  if (!res.ok) throw new Error(data.message || "Erro ao fazer login");
  return data;
}

export async function loginPessoa(payload: LoginPayload) {
  const url = `${API_BASE}/login-pessoa`;
  console.log("[API] POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("[API] Login response:", data);

  if (!res.ok) throw new Error(data.message || "Erro ao fazer login");
  return data;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE}${path}`;

  console.log("[API] Fetching:", url);
  console.log("[API] Token:", token ? `${token.slice(0, 20)}...` : "MISSING");

  if (!token) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  console.log("[API] Response status:", res.status);

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error("[API] Error:", errData);
    throw new Error(errData.message || `Erro ${res.status}`);
  }

  const data = await res.json();
  console.log("[API] Response data:", data);
  return data as T;
}
