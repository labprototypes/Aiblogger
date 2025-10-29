const apiHost = process.env.NEXT_PUBLIC_API_HOST;
// Handle both full URLs and hostnames
let API_BASE: string;
if (apiHost) {
  // If already includes protocol, use as-is
  if (apiHost.startsWith('http://') || apiHost.startsWith('https://')) {
    API_BASE = apiHost.replace(/\/$/, ''); // Remove trailing slash
  } else {
    // Otherwise, assume it's a hostname and add https://
    API_BASE = `https://${apiHost}`;
  }
} else {
  API_BASE = "http://localhost:8000";
}

export { API_BASE };

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
  locations?: Array<{ title: string; description: string; thumbnail?: string }> | null;
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
  location_id?: number | null;
  location_description?: string | null;
  outfit?: Record<string, any> | null;
  main_image_url?: string | null;
  prompts?: Record<string, any> | null;
  generated_images?: Record<string, any> | null;
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
    updateContent: (task_id: number, data: { idea?: string; script?: string }) => request(`/api/tasks/${task_id}/content`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (task_id: number) => request<{ ok: boolean }>(`/api/tasks/${task_id}`, { method: "DELETE" }),
    // Stats
    getStats: () => request<{
      total_tasks: number;
      tasks_this_week: number;
      completion_rate: number;
      status_distribution: Record<string, number>;
      content_type_distribution: Record<string, number>;
      tasks_over_time: Array<{ date: string; count: number }>;
      tasks_by_blogger: Record<string, number>;
    }>("/api/tasks/stats"),
    // Fashion generation endpoints
    updateFashionSetup: (task_id: number, data: { location_id?: number | null; location_description?: string | null; outfit?: Record<string, any> | null }) =>
      request<Task>(`/api/tasks/${task_id}/fashion/setup`, { method: "PATCH", body: JSON.stringify(data) }),
    generateMainFrame: (task_id: number, data: { prompt?: string; custom_instructions?: string }) =>
      request<{ image_url: string; prompt: string; task_id: number }>(`/api/tasks/${task_id}/fashion/generate-main-frame`, { method: "POST", body: JSON.stringify(data) }),
    approveFrame: (task_id: number, frame_type: string) =>
      request<{ ok: boolean; approved: string }>(`/api/tasks/${task_id}/fashion/approve-frame`, { method: "POST", body: JSON.stringify({ frame_type }) }),
    generateAdditionalFrames: (task_id: number, base_prompt?: string) =>
      request<{ frames: Array<{ angle: string; image_url: string; prompt: string }>; task_id: number }>(`/api/tasks/${task_id}/fashion/generate-additional-frames`, { method: "POST", body: JSON.stringify({ base_prompt }) }),
    // Podcaster generation endpoints
    updatePodcasterSetup: (task_id: number, data: { selected_location?: any; selected_frames?: any[]; script?: string }) =>
      request<Task>(`/api/tasks/${task_id}/podcaster/setup`, { method: "PATCH", body: JSON.stringify(data) }),
    generateAudio: (task_id: number, data: { script: string; voice_id: string }) =>
      request<{ audio_url: string; task_id: number }>(`/api/tasks/${task_id}/podcaster/generate-audio`, { method: "POST", body: JSON.stringify(data) }),
    generateLipsync: (task_id: number, data: { audio_url: string; image_url: string; frames?: any[] }) =>
      request<{ video_url: string; task_id: number }>(`/api/tasks/${task_id}/podcaster/generate-lipsync`, { method: "POST", body: JSON.stringify(data) }),
  },
  assistant: {
    generateMeta: (task_id: number) => request<{ ok: boolean; task_id: number }>(`/api/assistant/meta/generate`, { method: "POST", body: JSON.stringify({ task_id }) }),
    getMeta: (task_id: number) => request<{ task_id: number; data: any | null }>(`/api/assistant/meta/${task_id}`),
  },
};

// Task statuses (unified system)
export const TASK_STATUSES = [
  "DRAFT",
  "SETUP_READY",
  "GENERATING",
  "REVIEW",
  "APPROVED",
  "PUBLISHED"
] as const;
