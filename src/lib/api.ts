export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function parseErrorDetail(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    // FastAPI usually returns { detail: "..." } or { detail: [...] }
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) return "Validation error";
    return undefined;
  } catch {
    return undefined;
  }
}


export type SignupPayload = {
  email: string;
  full_name?: string | null;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserRead = {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};


export async function signup(payload: SignupPayload): Promise<UserRead> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(detail || "Signup failed", res.status, detail);
  }

  return res.json();
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(detail || "Login failed", res.status, detail);
  }

  return res.json();
}

export async function getCurrentUser(token: string): Promise<UserRead> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(detail || "Failed to get user", res.status, detail);
  }

  return res.json();
}


export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();

  if (!token) {
    throw new ApiError("No authentication token", 401);
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Authentication required", 401);
  }

  return res;
}


const TOKEN_KEY = "auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export type DocumentStatus = "uploaded" | "indexed" | "failed";
export type MessageRole = "user" | "assistant" | "system";

export type DocumentRead = {
  id: string;
  user_id: number;
  title: string;
  doc_type: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

export type ChatSession = {
  id: string;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  citations: { sources?: unknown[] } | null;
  created_at: string;
};

export async function listDocuments(): Promise<DocumentRead[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/documents`);

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(detail || "Failed to list documents", res.status, detail);
  }

  return res.json();
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chats`);

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(detail || "Failed to list chat sessions", res.status, detail);
  }

  return res.json();
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chats/${sessionId}/messages`);

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(detail || "Failed to get chat messages", res.status, detail);
  }

  return res.json();
}

export type CreateChatSessionPayload = {
  title?: string;
};

export async function createChatSession(payload?: CreateChatSessionPayload): Promise<ChatSession> {
  const res = await authenticatedFetch(`${API_BASE_URL}/chats`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(detail || "Failed to create chat session", res.status, detail);
  }

  return res.json();
}
