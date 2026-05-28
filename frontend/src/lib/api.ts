export type Project = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  resource_count: number;
};

export type Resource = {
  id: string;
  project_id: string;
  type: "pdf" | "pptx" | "youtube" | "video";
  title: string;
  ingestion_status: "queued" | "processing" | "ready" | "failed";
  ingestion_error: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let msg = `${r.status} ${r.statusText}`;
    try {
      const body = await r.json();
      if (body?.detail) msg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {}
    throw new Error(msg);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}

export const api = {
  listProjects: () => fetch("/api/projects").then(j<Project[]>),
  createProject: (name: string) =>
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(j<Project>),
  updateProject: (id: string, name: string) =>
    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(j<Project>),
  deleteProject: (id: string) => fetch(`/api/projects/${id}`, { method: "DELETE" }).then(j<void>),
  getProject: (id: string) => fetch(`/api/projects/${id}`).then(j<Project>),

  listResources: (projectId: string) =>
    fetch(`/api/projects/${projectId}/resources`).then(j<Resource[]>),
  uploadResource: (projectId: string, file: File, title?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title);
    return fetch(`/api/projects/${projectId}/resources`, { method: "POST", body: fd }).then(j<Resource>);
  },
  getResource: (id: string) => fetch(`/api/resources/${id}`).then(j<Resource>),
  deleteResource: (id: string) => fetch(`/api/resources/${id}`, { method: "DELETE" }).then(j<void>),
  resourceFileUrl: (id: string) => `/api/resources/${id}/file`,

  listChats: (resourceId: string) => fetch(`/api/resources/${resourceId}/chats`).then(j<Chat[]>),
  createChat: (resourceId: string, name?: string) =>
    fetch(`/api/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_id: resourceId, name }),
    }).then(j<Chat>),
  listMessages: (chatId: string) => fetch(`/api/chats/${chatId}/messages`).then(j<ChatMessage[]>),

  getSettings: () => fetch(`/api/settings`).then(j<Settings>),
  updateSettings: (patch: Partial<SettingsUpdate>) =>
    fetch(`/api/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(j<Settings>),
};

export type Chat = {
  id: string;
  project_id: string;
  resource_id: string;
  name: string;
  is_pinned: boolean;
  anchor_json: { page?: number; slide?: number; t_seconds?: number } | null;
  created_at: string;
  updated_at: string;
};

export type Citation = {
  type: string;
  anchor: { page?: number; slide?: number; t_seconds?: number };
  quote?: string;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content_text: string;
  citations_json: Citation[];
  suggested_followups_json: string[];
  created_at: string;
};

export type Settings = {
  chat_provider: string;
  chat_model: string;
  summary_provider: string;
  summary_model: string;
  pdf_context_pages: number;
  ppt_context_slides: number;
  video_context_seconds: number;
  whisper_model: string;
  has_google_key: boolean;
  has_openai_key: boolean;
  has_anthropic_key: boolean;
};

export type SettingsUpdate = {
  google_api_key: string;
  openai_api_key: string;
  anthropic_api_key: string;
  chat_provider: string;
  chat_model: string;
  pdf_context_pages: number;
};
