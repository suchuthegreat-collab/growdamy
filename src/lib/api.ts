const BASE = "https://pzzrmhuuwwukvhynsfje.supabase.co/functions/v1/make-server-d6bef2ee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "learner" | "tutor" | "company";
  industry?: string | null;
}

export interface Booking {
  id: string;
  tutorId?: string;
  tutorName?: string;
  learnerId?: string;
  learnerName?: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  earnings?: number;
  status: "upcoming" | "completed";
  createdAt: string;
}

export interface InterviewRequest {
  id: string;
  companyId: string;
  companyName: string;
  companyIndustry: string;
  tutorId: string;
  tutorName: string;
  message: string;
  date: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface AppNotification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: "view" | "request";
  createdAt: string;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json as T;
}

export const api = {
  auth: {
    signup: (data: { name: string; email: string; password: string; role: string; industry?: string }) =>
      request<{ user: User }>("POST", "/auth/signup", data),
    login: (email: string, password: string) =>
      request<{ user: User }>("POST", "/auth/login", { email, password }),
  },

  tutors: {
    list: () => request<{ tutors: any[] }>("GET", "/tutors"),
  },

  bookings: {
    create: (booking: {
      learnerId: string;
      tutorId: string;
      tutorName: string;
      subject: string;
      date: string;
      time: string;
      duration: number;
      earnings: number;
    }) => request<{ booking: Booking }>("POST", "/bookings", booking),
    forLearner: (userId: string) =>
      request<{ bookings: Booking[] }>("GET", `/bookings/learner/${userId}`),
    forTutor: (tutorId: string) =>
      request<{ bookings: Booking[] }>("GET", `/bookings/tutor/${tutorId}`),
  },

  interviewRequests: {
    send: (data: {
      companyId: string;
      companyName: string;
      companyIndustry: string;
      tutorId: string;
      tutorName: string;
      message: string;
    }) => request<{ request: InterviewRequest }>("POST", "/interview-requests", data),
    forCompany: (companyId: string) =>
      request<{ requests: InterviewRequest[] }>("GET", `/interview-requests/company/${companyId}`),
  },

  notifications: {
    get: (tutorId: string) =>
      request<{ notifications: AppNotification[] }>("GET", `/notifications/${tutorId}`),
    create: (tutorId: string, message: string, type: "view" | "request") =>
      request<{ notification: AppNotification }>("POST", "/notifications", { tutorId, message, type }),
    markAllRead: (tutorId: string) =>
      request<{ ok: boolean }>("PATCH", `/notifications/${tutorId}/read-all`),
  },
};
