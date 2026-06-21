import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const BASE = "/make-server-d6bef2ee";

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + "growdemy_2026_salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function pushNotification(
  tutorId: string,
  message: string,
  type: "view" | "request",
) {
  const key = `notifications:${tutorId}`;
  const existing = (await kv.get(key)) ?? [];
  const notif = {
    id: crypto.randomUUID(),
    message,
    time: "Just now",
    read: false,
    type,
    createdAt: new Date().toISOString(),
  };
  await kv.set(key, [notif, ...existing]);
  return notif;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_TUTORS = [
  { id: "t1", name: "Maya Chen", major: "Computer Science", university: "Stanford University", skills: ["Python", "Data Structures", "Machine Learning"], hourlyRate: 35, rating: 4.8, sessionsCompleted: 24, availability: ["Mon", "Wed", "Fri"], avatarColor: "purple", initials: "MC", bio: "CS junior with Google internship experience. I love breaking down complex algorithms into approachable concepts that actually stick." },
  { id: "t2", name: "Jordan Williams", major: "Economics", university: "UCLA", skills: ["Microeconomics", "Statistics", "Excel"], hourlyRate: 28, rating: 4.5, sessionsCompleted: 15, availability: ["Tue", "Thu", "Sat"], avatarColor: "teal", initials: "JW", bio: "Econ senior with TA experience. I have helped 40+ students ace their midterms with structured study plans." },
  { id: "t3", name: "Priya Sharma", major: "Mathematics", university: "MIT", skills: ["Calculus", "Linear Algebra", "Differential Equations"], hourlyRate: 32, rating: 4.9, sessionsCompleted: 41, availability: ["Mon", "Tue", "Wed", "Thu"], avatarColor: "purple", initials: "PS", bio: "Math PhD student specializing in applied mathematics. Patience is my superpower, no question is too basic." },
  { id: "t4", name: "Alex Rivera", major: "Chemistry", university: "UC Berkeley", skills: ["Organic Chemistry", "Biochemistry", "Lab Techniques"], hourlyRate: 30, rating: 4.3, sessionsCompleted: 12, availability: ["Wed", "Fri", "Sun"], avatarColor: "teal", initials: "AR", bio: "Pre-med junior making orgo actually make sense. Visual learner? Perfect, I draw everything out." },
  { id: "t5", name: "Sam Torres", major: "Physics", university: "Caltech", skills: ["Classical Mechanics", "Electromagnetism", "Quantum Physics"], hourlyRate: 38, rating: 4.1, sessionsCompleted: 7, availability: ["Mon", "Thu", "Sat"], avatarColor: "purple", initials: "ST", bio: "Physics senior who spent two summers at CERN. I approach each problem like a puzzle we solve together." },
  { id: "t6", name: "Zoe Kim", major: "English Literature", university: "Yale University", skills: ["Essay Writing", "Literary Analysis", "APA Citation"], hourlyRate: 22, rating: 4.7, sessionsCompleted: 33, availability: ["Tue", "Wed", "Fri", "Sat"], avatarColor: "teal", initials: "ZK", bio: "English senior and campus writing center tutor. I have reviewed 200+ essays and can help with any writing challenge." },
];

async function seedIfNeeded() {
  const seeded = await kv.get("tutors:seeded");
  if (seeded) return;

  await kv.set("tutors:list", SEED_TUTORS);

  // Demo tutor (Maya Chen = t1) notifications
  await kv.set("notifications:t1", [
    { id: "n1", message: "Google viewed your profile", time: "3 hours ago", read: false, type: "view", createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    { id: "n2", message: "Stripe sent you an interview request", time: "Jun 15, 2026", read: true, type: "request", createdAt: "2026-06-15T10:00:00Z" },
  ]);

  // Demo company (Stripe = demo_stripe) interview requests
  await kv.set("requests:company:demo_stripe", [
    { id: "r1", companyId: "demo_stripe", companyName: "Stripe", companyIndustry: "Fintech", tutorId: "t3", tutorName: "Priya Sharma", message: "We are building a STEM mentorship program and your background in applied mathematics is a perfect fit.", date: "Jun 17, 2026", status: "accepted", createdAt: "2026-06-17T10:00:00Z" },
    { id: "r2", companyId: "demo_stripe", companyName: "Stripe", companyIndustry: "Fintech", tutorId: "t1", tutorName: "Maya Chen", message: "Interested in speaking about our early-talent engineering program. Your ML experience stands out.", date: "Jun 15, 2026", status: "pending", createdAt: "2026-06-15T10:00:00Z" },
  ]);

  // Demo learner bookings
  await kv.set("bookings:learner:demo_learner", [
    { id: "b1", learnerId: "demo_learner", tutorId: "t1", tutorName: "Maya Chen", subject: "Python Fundamentals", date: "Jun 22, 2026", time: "3:00 PM", duration: 60, earnings: 35, status: "upcoming", createdAt: "2026-06-19T10:00:00Z" },
    { id: "b2", learnerId: "demo_learner", tutorId: "t3", tutorName: "Priya Sharma", subject: "Multivariable Calculus", date: "Jun 25, 2026", time: "11:00 AM", duration: 90, earnings: 48, status: "upcoming", createdAt: "2026-06-19T11:00:00Z" },
    { id: "b3", learnerId: "demo_learner", tutorId: "t6", tutorName: "Zoe Kim", subject: "Thesis Introduction Draft", date: "Jun 18, 2026", time: "2:00 PM", duration: 60, earnings: 22, status: "completed", createdAt: "2026-06-18T14:00:00Z" },
    { id: "b4", learnerId: "demo_learner", tutorId: "t2", tutorName: "Jordan Williams", subject: "Game Theory Basics", date: "Jun 14, 2026", time: "4:00 PM", duration: 60, earnings: 28, status: "completed", createdAt: "2026-06-14T16:00:00Z" },
  ]);

  // Demo tutor bookings
  await kv.set("bookings:tutor:t1", [
    { id: "tb1", tutorId: "t1", learnerId: "s1", learnerName: "Marcus Johnson", subject: "Python Fundamentals", date: "Jun 22, 2026", time: "3:00 PM", duration: 60, earnings: 35, status: "upcoming", createdAt: "2026-06-19T10:00:00Z" },
    { id: "tb2", tutorId: "t1", learnerId: "s2", learnerName: "Sofia Patel", subject: "Data Structures", date: "Jun 24, 2026", time: "4:00 PM", duration: 90, earnings: 52.5, status: "upcoming", createdAt: "2026-06-19T11:00:00Z" },
    { id: "tb3", tutorId: "t1", learnerId: "s3", learnerName: "Ethan Brooks", subject: "Machine Learning Intro", date: "Jun 26, 2026", time: "10:00 AM", duration: 60, earnings: 35, status: "upcoming", createdAt: "2026-06-19T12:00:00Z" },
  ]);

  await kv.set("tutors:seeded", true);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post(`${BASE}/auth/signup`, async (c) => {
  try {
    const { name, email, password, role, industry } = await c.req.json();
    if (!name || !email || !password || !role) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    const key = `user:email:${email.toLowerCase()}`;
    const existing = await kv.get(key);
    if (existing) return c.json({ error: "An account with that email already exists" }, 400);

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const user = {
      id,
      name,
      email: email.toLowerCase(),
      role,
      industry: industry ?? null,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await kv.set(key, user);
    await kv.set(`user:id:${id}`, user);

    const { passwordHash: _ph, ...safeUser } = user;
    return c.json({ user: safeUser });
  } catch {
    return c.json({ error: "Signup failed. Please try again." }, 500);
  }
});

app.post(`${BASE}/auth/login`, async (c) => {
  try {
    const { email, password } = await c.req.json();
    const user = await kv.get(`user:email:${email.toLowerCase()}`);
    if (!user) return c.json({ error: "Invalid email or password" }, 401);

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return c.json({ error: "Invalid email or password" }, 401);

    const { passwordHash: _ph, ...safeUser } = user;
    return c.json({ user: safeUser });
  } catch {
    return c.json({ error: "Login failed. Please try again." }, 500);
  }
});

// ── Tutors ────────────────────────────────────────────────────────────────────

app.get(`${BASE}/tutors`, async (c) => {
  try {
    await seedIfNeeded();
    const tutors = (await kv.get("tutors:list")) ?? [];
    return c.json({ tutors });
  } catch {
    return c.json({ error: "Failed to load tutors" }, 500);
  }
});

// ── Bookings ──────────────────────────────────────────────────────────────────

app.post(`${BASE}/bookings`, async (c) => {
  try {
    const body = await c.req.json();
    const booking = {
      ...body,
      id: crypto.randomUUID(),
      status: "upcoming",
      createdAt: new Date().toISOString(),
    };
    const lKey = `bookings:learner:${body.learnerId}`;
    const tKey = `bookings:tutor:${body.tutorId}`;
    const [lBookings, tBookings] = await kv.mget([lKey, tKey]);
    await kv.mset(
      [lKey, tKey],
      [[booking, ...(lBookings ?? [])], [booking, ...(tBookings ?? [])]],
    );
    return c.json({ booking });
  } catch {
    return c.json({ error: "Failed to create booking" }, 500);
  }
});

app.get(`${BASE}/bookings/learner/:userId`, async (c) => {
  await seedIfNeeded();
  const bookings = (await kv.get(`bookings:learner:${c.req.param("userId")}`)) ?? [];
  return c.json({ bookings });
});

app.get(`${BASE}/bookings/tutor/:tutorId`, async (c) => {
  await seedIfNeeded();
  const bookings = (await kv.get(`bookings:tutor:${c.req.param("tutorId")}`)) ?? [];
  return c.json({ bookings });
});

// ── Interview Requests ────────────────────────────────────────────────────────

app.post(`${BASE}/interview-requests`, async (c) => {
  try {
    const body = await c.req.json();
    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
    const req = {
      ...body,
      id: crypto.randomUUID(),
      status: "pending",
      date: dateStr,
      createdAt: new Date().toISOString(),
    };
    const cKey = `requests:company:${body.companyId}`;
    const tKey = `requests:tutor:${body.tutorId}`;
    const [cReqs, tReqs] = await kv.mget([cKey, tKey]);
    await kv.mset(
      [cKey, tKey],
      [[req, ...(cReqs ?? [])], [req, ...(tReqs ?? [])]],
    );
    await pushNotification(body.tutorId, `${body.companyName} sent you an interview request`, "request");
    return c.json({ request: req });
  } catch {
    return c.json({ error: "Failed to send interview request" }, 500);
  }
});

app.get(`${BASE}/interview-requests/company/:companyId`, async (c) => {
  await seedIfNeeded();
  const requests = (await kv.get(`requests:company:${c.req.param("companyId")}`)) ?? [];
  return c.json({ requests });
});

// ── Notifications ─────────────────────────────────────────────────────────────

app.post(`${BASE}/notifications`, async (c) => {
  try {
    const { tutorId, message, type } = await c.req.json();
    const notif = await pushNotification(tutorId, message, type);
    return c.json({ notification: notif });
  } catch {
    return c.json({ error: "Failed to create notification" }, 500);
  }
});

app.get(`${BASE}/notifications/:tutorId`, async (c) => {
  await seedIfNeeded();
  const notifications = (await kv.get(`notifications:${c.req.param("tutorId")}`)) ?? [];
  return c.json({ notifications });
});

app.patch(`${BASE}/notifications/:tutorId/read-all`, async (c) => {
  try {
    const key = `notifications:${c.req.param("tutorId")}`;
    const notifications = (await kv.get(key)) ?? [];
    await kv.set(key, notifications.map((n: any) => ({ ...n, read: true })));
    return c.json({ ok: true });
  } catch {
    return c.json({ error: "Failed to mark notifications read" }, 500);
  }
});

Deno.serve(app.fetch);
