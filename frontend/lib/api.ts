import axios from "axios";

// Use Next.js API proxy for all requests
const API_BASE_URL = "/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data: any) => api.post("/auth/register", data),
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
};

// Curriculum
export const curriculumAPI = {
  upload: (formData: FormData) =>
    api.post("/curriculum/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getById: (id: number) => api.get(`/curriculum/${id}`),
  validate: (id: number, data: any) =>
    api.put(`/curriculum/${id}/validate`, data),
  getLibrary: () => api.get("/curriculum/library"),
};

// Subjects
export const subjectsAPI = {
  getAll: () => api.get("/subjects"),
  getById: (id: number) => api.get(`/subjects/${id}`),
  create: (data: any) => api.post("/subjects", data),
  update: (id: number, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: number) => api.delete(`/subjects/${id}`),
};

// Progress
export const progressAPI = {
  get: (subjectId: number) => api.get(`/progress/${subjectId}`),
  markComplete: (data: any) => api.post("/progress/mark-complete", data),
  undo: (id: number) => api.delete(`/progress/${id}`),
};

// Notes
export const notesAPI = {
  upload: (formData: FormData) =>
    api.post("/notes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: () => api.get("/notes"),
  getById: (id: number) => api.get(`/notes/${id}`),
  delete: (id: number) => api.delete(`/notes/${id}`),
  getPresentation: (id: number) => api.get(`/notes/${id}/present`),
};
