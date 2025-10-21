const apiHost = process.env.NEXT_PUBLIC_API_HOST;
export const API_BASE = apiHost ? `https://${apiHost}` : "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

export type Blogger = {
  id: number;
  name: string;
  type: string;
  image?: string | null;
  tone_of_voice?: string | null;
  theme?: string | null;
  voice_id?: string | null;
  content_schedule?: Record<string, any> | null;
  content_types?: Record<string, any> | null;
};

export type Task = {
  id: number;
  blogger_id: number;
  date: string; // YYYY-MM-DD
  content_type: string;
  idea?: string | null;
  status: string;
  script?: string | null;
  preview_url?: string | null;
};

export const api = {
  bloggers: {
    list: () => request<Blogger[]>("/api/bloggers/"),
    create: (data: { name: string; type: string }) =>
      request<Blogger>("/api/bloggers/", { method: "POST", body: JSON.stringify(data) }),
    get: (id: number) => request<Blogger>(`/api/bloggers/${id}`),
    update: (
      id: number,
      data: {
        name: string;
        type: string;
        image?: string;
        tone_of_voice?: string;
        theme?: string;
        voice_id?: string;
        content_schedule?: Record<string, any>;
        content_types?: Record<string, any>;
      }
    ) =>
      request<Blogger>(`/api/bloggers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ ok: boolean }>(`/api/bloggers/${id}`, { method: "DELETE" }),
  },
  tasks: {
    list: (opts?: { blogger_id?: number }) =>
      request<Task[]>(`/api/tasks${opts?.blogger_id ? `?blogger_id=${opts.blogger_id}` : ""}`),
    get: (id: number) => request<Task>(`/api/tasks/${id}`),
    create: (data: { blogger_id: number; date: string; content_type: string; idea?: string; status?: string }) =>
      request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (task_id: number, status: string) =>
      request<Task>(`/api/tasks/${task_id}`, { method: "PUT", body: JSON.stringify({ status }) }),
    generate: (task_id: number) => request<{ queued: boolean; task_id: number; job_id: string }>(`/api/tasks/${task_id}/generate`, { method: "POST" }),
  generateScript: (task_id: number) => request<{ ok: boolean; task_id: number; status: string }>(`/api/tasks/${task_id}/script`, { method: "POST" }),
  delete: (task_id: number) => request<{ ok: boolean }>(`/api/tasks/${task_id}`, { method: "DELETE" }),
  },
};

export const TASK_STATUSES = [
  "DRAFT",
  "PLANNED",
  "SCRIPT_READY",
  "VISUAL_READY",
  "APPROVED",
] as const;
