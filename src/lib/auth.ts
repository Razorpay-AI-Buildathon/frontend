export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  google_subject_id?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
      headers: { "Cache-Control": "no-cache" },
    });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`Auth check failed: ${res.status}`);
    const data = await res.json();
    return data as User;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export function loginWithGoogle(): void {
  window.location.href = `${API_BASE}/api/auth/google`;
}
