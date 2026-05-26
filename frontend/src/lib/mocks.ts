export type Project = {
  id: string;
  name: string;
  resources: number;
  stars: number;
  lastSeen: string;
};

export const PROJECTS: Project[] = [
  { id: "os", name: "Operating Systems", resources: 12, stars: 47, lastSeen: "2h" },
  { id: "dbms", name: "DBMS Mid-Sem", resources: 8, stars: 31, lastSeen: "1d" },
  { id: "ml", name: "Machine Learning", resources: 21, stars: 64, lastSeen: "3d" },
  { id: "algo", name: "Algorithms", resources: 6, stars: 19, lastSeen: "1w" },
  { id: "cn", name: "Computer Networks", resources: 4, stars: 12, lastSeen: "2w" },
  { id: "se", name: "Software Engineering", resources: 3, stars: 13, lastSeen: "3w" },
];

export type Resource = {
  id: string;
  projectId: string;
  type: "pdf" | "pptx" | "youtube" | "video";
  title: string;
  status: "queued" | "processing" | "ready" | "failed";
  hint: string;
};

export const RESOURCES: Resource[] = [
  { id: "r1", projectId: "os", type: "pdf", title: "OS Notes — Silberschatz", status: "ready", hint: "412 pages" },
  { id: "r2", projectId: "os", type: "pdf", title: "Process Scheduling — Handout", status: "ready", hint: "38 pages" },
  { id: "r3", projectId: "os", type: "pptx", title: "Memory Management Deck", status: "ready", hint: "47 slides" },
  { id: "r4", projectId: "os", type: "youtube", title: "Threads, Locks & Memory Model", status: "ready", hint: "47:13" },
  { id: "r5", projectId: "os", type: "video", title: "Lecture 09 recording", status: "processing", hint: "transcribing" },
];

export type RecentStar = {
  id: string;
  kind: "page" | "slide" | "timestamp" | "selection" | "chat";
  source: string;
  summary: string;
  ago: string;
};

export const RECENT_STARS: RecentStar[] = [
  { id: "s1", kind: "page", source: "OS Notes — p.47", summary: "FCFS scheduling: simple FIFO; suffers convoy effect when a long process is followed by short ones.", ago: "2h" },
  { id: "s2", kind: "selection", source: "OS Notes — p.47", summary: "“The process that requests the CPU first is allocated the CPU first.”", ago: "2h" },
  { id: "s3", kind: "slide", source: "Memory Mgmt Deck — slide 12", summary: "Three address-binding times: compile, load, execution. Most modern OSes defer to execution time.", ago: "5h" },
  { id: "s4", kind: "timestamp", source: "Threads & Locks — 12:34", summary: "Why double-checked locking was broken pre-JSR-133 and how the memory model fixed it.", ago: "1d" },
];
