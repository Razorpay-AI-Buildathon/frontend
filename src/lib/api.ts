const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const API = {
  metrics: () => `${API_BASE}/api/metrics`,
  cases: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return `${API_BASE}/api/cases${q.toString() ? `?${q}` : ""}`;
  },
  case: (id: string) => `${API_BASE}/api/cases/${id}`,
  caseReview: (id: string) => `${API_BASE}/api/cases/${id}/review`,
  caseStream: () => `${API_BASE}/api/cases/stream`,
  ingestPayment: () => `${API_BASE}/api/events/payment`,
  audit: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return `${API_BASE}/api/audit${q.toString() ? `?${q}` : ""}`;
  },
  analyticsStrategies: () => `${API_BASE}/api/analytics/strategies`,
  gatewayStatus: () => `${API_BASE}/api/gateway/status`,
  health: () => `${API_BASE}/health`,
  authMe: () => `${API_BASE}/api/auth/me`,
  authLogout: () => `${API_BASE}/api/auth/logout`,
  createOrder: () => `${API_BASE}/api/create-order`,
  verifyPayment: () => `${API_BASE}/api/verify-payment`,
  checkoutFailed: () => `${API_BASE}/api/checkout/failed`,
};

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });
}

export function formatINR(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

export function timeAgo(dateStr: string): string {
  const parsedStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`;
  const now = Date.now();
  const then = new Date(parsedStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  
  if (diff < 0) return "0s ago"; // Handle slight clock skew
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const STATUS_COLOR: Record<string, "positive" | "negative" | "notice" | "information" | "neutral"> = {
  RECOVERED: "positive",
  APPROVED: "positive",
  EXECUTING: "information",
  ACTION_PROPOSED: "information",
  ANALYZING: "information",
  GUARD_REVIEW: "notice",
  HUMAN_REVIEW: "notice",
  IDENTIFIED: "notice",
  DETECTED: "notice",
  FAILED: "negative",
  BLOCKED: "negative",
  CLOSED: "neutral",
  HIGH: "negative",
  MEDIUM: "notice",
  LOW: "positive",
};

export const FAILURE_LABELS: Record<string, string> = {
  card_declined: "Card Declined",
  insufficient_funds: "Insufficient Funds",
  bank_timeout: "Bank Timeout",
  network_error: "Network Error",
  card_expired: "Card Expired",
  authentication_failed: "Auth Failed",
  do_not_honor: "Do Not Honor",
  invalid_cvv: "Invalid CVV",
};
