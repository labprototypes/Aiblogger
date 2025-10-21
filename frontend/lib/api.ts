export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
};

export const api = {
  bloggers: {
    list: () => request<Blogger[]>("/api/bloggers/"),
    create: (data: { name: string; type: string }) =>
      request<Blogger>("/api/bloggers/", { method: "POST", body: JSON.stringify(data) }),
    get: (id: number) => request<Blogger>(`/api/bloggers/${id}`),
    update: (id: number, data: { name: string; type: string }) =>
      request<Blogger>(`/api/bloggers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ ok: boolean }>(`/api/bloggers/${id}`, { method: "DELETE" }),
  },
};
