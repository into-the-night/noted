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
};
