import { useState, useEffect } from "react";
import {
  BadgeCheck,
  Star,
  DollarSign,
  BookOpen,
  Users,
  Calendar,
  ChevronRight,
  Search,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Shield,
  Sparkles,
  Bell,
  Building2,
  Send,
  Briefcase,
  Eye,
  LogOut,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "../lib/api";
import type { User, Booking, InterviewRequest, AppNotification } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "learner" | "tutor" | "company";
type View =
  | "landing"
  | "login"
  | "signup"
  | "learner-dashboard"
  | "learner-browse"
  | "tutor-profile"
  | "tutor-dashboard"
  | "company-dashboard"
  | "company-browse"
  | "company-tutor-profile";

interface Tutor {
  id: string;
  name: string;
  major: string;
  university: string;
  skills: string[];
  hourlyRate: number;
  rating: number;
  sessionsCompleted: number;
  availability: string[];
  bio: string;
  initials: string;
  avatarColor: "purple" | "teal";
}

// ─── Static fallback data (matches seeded backend) ────────────────────────────

const STATIC_TUTORS: Tutor[] = [
  { id: "t1", name: "Maya Chen", major: "Computer Science", university: "Stanford University", skills: ["Python", "Data Structures", "Machine Learning"], hourlyRate: 35, rating: 4.8, sessionsCompleted: 24, availability: ["Mon", "Wed", "Fri"], initials: "MC", avatarColor: "purple", bio: "CS junior with Google internship experience. I love breaking down complex algorithms into approachable concepts that actually stick." },
  { id: "t2", name: "Jordan Williams", major: "Economics", university: "UCLA", skills: ["Microeconomics", "Statistics", "Excel"], hourlyRate: 28, rating: 4.5, sessionsCompleted: 15, availability: ["Tue", "Thu", "Sat"], initials: "JW", avatarColor: "teal", bio: "Econ senior with TA experience. I have helped 40+ students ace their midterms with structured study plans." },
  { id: "t3", name: "Priya Sharma", major: "Mathematics", university: "MIT", skills: ["Calculus", "Linear Algebra", "Differential Equations"], hourlyRate: 32, rating: 4.9, sessionsCompleted: 41, availability: ["Mon", "Tue", "Wed", "Thu"], initials: "PS", avatarColor: "purple", bio: "Math PhD student specializing in applied mathematics. Patience is my superpower, no question is too basic." },
  { id: "t4", name: "Alex Rivera", major: "Chemistry", university: "UC Berkeley", skills: ["Organic Chemistry", "Biochemistry", "Lab Techniques"], hourlyRate: 30, rating: 4.3, sessionsCompleted: 12, availability: ["Wed", "Fri", "Sun"], initials: "AR", avatarColor: "teal", bio: "Pre-med junior making orgo actually make sense. Visual learner? Perfect, I draw everything out." },
  { id: "t5", name: "Sam Torres", major: "Physics", university: "Caltech", skills: ["Classical Mechanics", "Electromagnetism", "Quantum Physics"], hourlyRate: 38, rating: 4.1, sessionsCompleted: 7, availability: ["Mon", "Thu", "Sat"], initials: "ST", avatarColor: "purple", bio: "Physics senior who spent two summers at CERN. I approach each problem like a puzzle we solve together." },
  { id: "t6", name: "Zoe Kim", major: "English Literature", university: "Yale University", skills: ["Essay Writing", "Literary Analysis", "APA Citation"], hourlyRate: 22, rating: 4.7, sessionsCompleted: 33, availability: ["Tue", "Wed", "Fri", "Sat"], initials: "ZK", avatarColor: "teal", bio: "English senior and campus writing center tutor. I have reviewed 200+ essays and can help with any writing challenge." },
];

const ALL_SKILLS = ["All", "Python", "Calculus", "Organic Chemistry", "Microeconomics", "Linear Algebra", "Essay Writing", "Physics", "Statistics"];

const DEMO_USERS: Record<Role, User> = {
  learner: { id: "demo_learner", name: "Alex Morgan", email: "alex@demo.edu", role: "learner" },
  tutor: { id: "t1", name: "Maya Chen", email: "maya@demo.edu", role: "tutor" },
  company: { id: "demo_stripe", name: "Stripe", email: "recruiting@stripe.com", role: "company", industry: "Fintech" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVerified(tutor: Tutor): boolean {
  return tutor.sessionsCompleted >= 10 && tutor.rating >= 4.2;
}

function getStoredUser(): User | null {
  try { return JSON.parse(localStorage.getItem("growdemy_user") || "null"); }
  catch { return null; }
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/25", size === "sm" && "text-xs px-2 py-0.5", size === "md" && "text-sm px-2.5 py-1", size === "lg" && "text-base px-3 py-1.5")}>
      <BadgeCheck className={clsx(size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5")} />
      Verified Tutor
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-semibold text-amber-400">{rating.toFixed(1)}</span>
    </span>
  );
}

function Avatar({ tutor, size = "md" }: { tutor: Tutor; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-base", lg: "h-16 w-16 text-xl", xl: "h-20 w-20 text-2xl" };
  return (
    <div className={clsx("rounded-full flex items-center justify-center font-bold text-white flex-shrink-0", sizeClasses[size])} style={{ backgroundColor: tutor.avatarColor === "purple" ? "#7c3aed" : "#0d9488" }}>
      {tutor.initials}
    </div>
  );
}

function CompanyLogo({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-base" };
  return (
    <div className={clsx("rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br from-violet-600 to-indigo-700", sizeClasses[size])}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "accepted" | "declined" }) {
  const s = { pending: "bg-amber-500/10 text-amber-400 border-amber-500/25", accepted: "bg-teal-500/10 text-teal-400 border-teal-500/25", declined: "bg-red-500/10 text-red-400 border-red-500/25" };
  return <span className={clsx("text-xs px-2 py-1 rounded-full border font-medium capitalize", s[status])}>{status}</span>;
}

function TutorCard({ tutor, onView, onBook, mode = "learner" }: { tutor: Tutor; onView: () => void; onBook?: () => void; mode?: "learner" | "company" }) {
  const verified = isVerified(tutor);
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-purple-500/40 transition-all duration-200 cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar tutor={tutor} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base leading-tight">{tutor.name}</h3>
              {verified && <VerifiedBadge size="sm" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{tutor.major} · {tutor.university}</p>
          </div>
        </div>
        {mode === "learner" && (
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-foreground">${tutor.hourlyRate}</p>
            <p className="text-xs text-muted-foreground">/hour</p>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{tutor.bio}</p>
      <div className="flex flex-wrap gap-1.5">
        {tutor.skills.map((skill) => (
          <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">{skill}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-3">
          <StarRating rating={tutor.rating} />
          <span className="text-xs text-muted-foreground">{tutor.sessionsCompleted} sessions</span>
        </div>
        {mode === "learner" && onBook && (
          <button className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity" onClick={(e) => { e.stopPropagation(); onBook(); }}>Book</button>
        )}
        {mode === "company" && (
          <button className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/40 text-indigo-300 font-semibold hover:bg-indigo-500/10 transition-colors" onClick={(e) => { e.stopPropagation(); onView(); }}>View Profile</button>
        )}
      </div>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function Nav({ currentUser, unreadCount, onNavigate, onLogout }: { currentUser: User | null; unreadCount: number; onNavigate: (view: View) => void; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const role = currentUser?.role ?? null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate("landing")} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>Growdemy</span>
        </button>

        <div className="hidden sm:flex items-center gap-3">
          {!role && (
            <>
              <button onClick={() => onNavigate("learner-browse")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Browse Tutors</button>
              <button onClick={() => onNavigate("login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Log in</button>
              <button onClick={() => onNavigate("signup")} className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">Sign up</button>
            </>
          )}
          {role === "learner" && (
            <>
              <button onClick={() => onNavigate("learner-browse")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Find Tutors</button>
              <button onClick={() => onNavigate("learner-dashboard")} className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">Dashboard</button>
              <button onClick={onLogout} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><LogOut className="h-4 w-4" /></button>
            </>
          )}
          {role === "tutor" && (
            <>
              <button onClick={() => onNavigate("tutor-dashboard")} className="relative text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                Dashboard
                {unreadCount > 0 && <span className="h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
              </button>
              <button onClick={onLogout} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><LogOut className="h-4 w-4" /></button>
            </>
          )}
          {role === "company" && (
            <>
              <button onClick={() => onNavigate("company-browse")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Browse Talent</button>
              <button onClick={() => onNavigate("company-dashboard")} className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">Dashboard</button>
              <button onClick={onLogout} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><LogOut className="h-4 w-4" /></button>
            </>
          )}
        </div>

        <button className="sm:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          {!role && (
            <>
              <button onClick={() => { onNavigate("learner-browse"); setMenuOpen(false); }} className="text-sm text-left py-2 text-muted-foreground">Browse Tutors</button>
              <button onClick={() => { onNavigate("login"); setMenuOpen(false); }} className="text-sm text-left py-2 text-muted-foreground">Log in</button>
              <button onClick={() => { onNavigate("signup"); setMenuOpen(false); }} className="text-sm text-left py-2 text-primary font-semibold">Sign up</button>
            </>
          )}
          {role === "learner" && (
            <>
              <button onClick={() => { onNavigate("learner-browse"); setMenuOpen(false); }} className="text-sm text-left py-2 text-muted-foreground">Find Tutors</button>
              <button onClick={() => { onNavigate("learner-dashboard"); setMenuOpen(false); }} className="text-sm text-left py-2 text-primary font-semibold">Dashboard</button>
              <button onClick={() => { onLogout(); setMenuOpen(false); }} className="text-sm text-left py-2 text-muted-foreground">Log out</button>
            </>
          )}
          {role === "tutor" && (
            <>
              <button onClick={() => { onNavigate("tutor-dashboard"); setMenuOpen(false); }} className="text-sm text-left py-2 text-primary font-semibold">Dashboard</button>
              <button onClick={() => { onLogout(); setMenuOpen(false); }} className="text-sm text-left py-2 text-muted-foreground">Log out</button>
            </>
          )}
          {role === "company" && (
            <>
              <button onClick={() => { onNavigate("company-browse"); setMenuOpen(false); }} className="text-sm text-left py-2 text-muted-foreground">Browse Talent</button>
              <button onClick={() => { onNavigate("company-dashboard"); setMenuOpen(false); }} className="text-sm text-left py-2 text-primary font-semibold">Dashboard</button>
              <button onClick={() => { onLogout(); setMenuOpen(false); }} className="text-sm text-left py-2 text-muted-foreground">Log out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ─── Book Session ─────────────────────────────────────────────────────────────

function BookSessionView({ tutor, onBack, onBook }: { tutor: Tutor; onBack: () => void; onBook: (date: string, time: string, duration: number) => Promise<void> }) {
  const [selectedDate, setSelectedDate] = useState("Jun 22, 2026");
  const [selectedTime, setSelectedTime] = useState("3:00 PM");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const dates = ["Jun 22, 2026", "Jun 23, 2026", "Jun 25, 2026", "Jun 27, 2026"];
  const times = ["9:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "5:00 PM"];
  const durations = [30, 60, 90];
  const total = (tutor.hourlyRate * selectedDuration) / 60;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onBook(selectedDate, selectedTime, selectedDuration);
      setConfirmed(true);
    } catch {
      setConfirmed(true); // Still show success UI in demo
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-teal-500/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Session Booked!</h2>
        <p className="text-muted-foreground mb-1">You have a session with <strong className="text-foreground">{tutor.name}</strong></p>
        <p className="text-muted-foreground mb-8">{selectedDate} at {selectedTime} · {selectedDuration} min</p>
        <div className="bg-card border border-border rounded-xl p-4 text-left mb-8">
          <p className="text-xs text-muted-foreground mb-1">Calendar invite sent to your email</p>
          <p className="text-sm font-medium text-foreground">Saved to your dashboard</p>
        </div>
        <button onClick={onBack} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">Back to Browse</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">← Back</button>

      <div className="bg-card border border-border rounded-xl p-5 mb-6 flex items-center gap-4">
        <Avatar tutor={tutor} size="md" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{tutor.name}</h3>
            {isVerified(tutor) && <VerifiedBadge size="sm" />}
          </div>
          <p className="text-sm text-muted-foreground">{tutor.major} · ${tutor.hourlyRate}/hr</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-5">Book a Session</h2>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold mb-2">Select Date</p>
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <button key={d} onClick={() => setSelectedDate(d)} className={clsx("text-xs px-3 py-1.5 rounded-lg border transition-all", selectedDate === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-purple-500/40")}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Select Time</p>
          <div className="flex flex-wrap gap-2">
            {times.map((t) => (
              <button key={t} onClick={() => setSelectedTime(t)} className={clsx("text-xs px-3 py-1.5 rounded-lg border transition-all", selectedTime === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-purple-500/40")}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Duration</p>
          <div className="flex gap-2">
            {durations.map((d) => (
              <button key={d} onClick={() => setSelectedDuration(d)} className={clsx("text-xs px-3 py-1.5 rounded-lg border transition-all", selectedDuration === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-purple-500/40")}>{d} min</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-xl p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">{selectedDuration} min × ${tutor.hourlyRate}/hr</span>
          <span className="font-bold text-foreground">${total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Calendar invite sent to both parties automatically</p>
      </div>

      <button onClick={handleConfirm} disabled={loading} className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking...</> : `Confirm Booking · $${total.toFixed(2)}`}
      </button>
    </div>
  );
}

// ─── Tutor Profile (learner) ──────────────────────────────────────────────────

function TutorProfileView({ tutor, onBook, onBack }: { tutor: Tutor; onBook: () => void; onBack: () => void }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const verified = isVerified(tutor);
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">← Back to browse</button>
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar tutor={tutor} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{tutor.name}</h1>
              {verified && <VerifiedBadge size="md" />}
            </div>
            <p className="text-muted-foreground mb-3">{tutor.major} · {tutor.university}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <StarRating rating={tutor.rating} />
              <span className="text-sm text-muted-foreground">{tutor.sessionsCompleted} sessions</span>
              <span className="text-base font-bold text-foreground">${tutor.hourlyRate}<span className="text-sm font-normal text-muted-foreground">/hr</span></span>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{tutor.bio}</p>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {tutor.skills.map((s) => <span key={s} className="text-sm px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">{s}</span>)}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Availability</h3>
          <div className="flex gap-2 flex-wrap">
            {days.map((day) => (
              <span key={day} className={clsx("text-xs px-2.5 py-1 rounded-lg font-medium border", tutor.availability.includes(day) ? "bg-teal-500/15 text-teal-300 border-teal-500/25" : "bg-muted text-muted-foreground border-transparent opacity-30")}>{day}</span>
            ))}
          </div>
        </div>
      </div>
      <button onClick={onBook} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">
        Book a Session with {tutor.name.split(" ")[0]}
      </button>
    </div>
  );
}

// ─── Company Tutor Profile ────────────────────────────────────────────────────

function CompanyTutorProfileView({ tutor, companyName, onBack, onRequestSent }: { tutor: Tutor; companyName: string; onBack: () => void; onRequestSent: (message: string) => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await onRequestSent(message);
      setSent(true);
    } catch {
      setSent(true); // Still show success
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">← Back to browse</button>
      <div className="flex items-center gap-2 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-2.5 mb-5">
        <BadgeCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-300">You are viewing a Verified Tutor — eligible for company interview requests.</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar tutor={tutor} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{tutor.name}</h1>
              <VerifiedBadge size="md" />
            </div>
            <p className="text-muted-foreground mb-3">{tutor.major} · {tutor.university}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <StarRating rating={tutor.rating} />
              <span className="text-sm text-muted-foreground">{tutor.sessionsCompleted} sessions</span>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{tutor.bio}</p>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {tutor.skills.map((s) => <span key={s} className="text-sm px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">{s}</span>)}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Availability</h3>
          <div className="flex gap-2 flex-wrap">
            {days.map((day) => (
              <span key={day} className={clsx("text-xs px-2.5 py-1 rounded-lg font-medium border", tutor.availability.includes(day) ? "bg-teal-500/15 text-teal-300 border-teal-500/25" : "bg-muted text-muted-foreground border-transparent opacity-30")}>{day}</span>
            ))}
          </div>
        </div>
      </div>

      {sent ? (
        <div className="bg-teal-500/8 border border-teal-500/25 rounded-xl p-5 text-center">
          <CheckCircle2 className="h-7 w-7 text-teal-400 mx-auto mb-2" />
          <p className="font-semibold text-teal-300 mb-0.5">Interview Request Sent</p>
          <p className="text-sm text-muted-foreground">{tutor.name} has been notified. You can track this in your dashboard.</p>
        </div>
      ) : showForm ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-1">Send Interview Request</h3>
          <p className="text-xs text-muted-foreground mb-4">{tutor.name} will receive a notification that {companyName} is interested in connecting.</p>
          <label className="text-sm font-semibold block mb-1.5">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Hi ${tutor.name.split(" ")[0]}, we at ${companyName} would love to connect about...`} rows={4} className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none mb-3" />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleSend} disabled={!message.trim() || loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 inline-flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : <><Send className="h-3.5 w-3.5" /> Send Request</>}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2">
          <Briefcase className="h-4 w-4" /> Send Interview Request
        </button>
      )}
    </div>
  );
}

// ─── Company Browse ───────────────────────────────────────────────────────────

function CompanyBrowseView({ tutors, onViewTutor }: { tutors: Tutor[]; onViewTutor: (tutor: Tutor) => void }) {
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const verified = tutors.filter(isVerified);

  const filtered = verified.filter((t) => {
    const matchesSkill = selectedSkill === "All" || t.skills.some((s) => s.toLowerCase().includes(selectedSkill.toLowerCase()));
    const matchesSearch = searchQuery === "" || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSkill && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start gap-4 mb-8 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Browse Verified Talent</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 font-semibold">Verified Only</span>
          </div>
          <p className="text-sm text-muted-foreground">{verified.length} verified tutors · 10+ sessions · 4.2+ rating</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or skill..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {ALL_SKILLS.map((skill) => (
          <button key={skill} onClick={() => setSelectedSkill(skill)} className={clsx("text-xs px-3 py-1.5 rounded-full border transition-all", selectedSkill === skill ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-500/40")}>{skill}</button>
        ))}
      </div>
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tutor) => <TutorCard key={tutor.id} tutor={tutor} mode="company" onView={() => onViewTutor(tutor)} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No verified tutors match that search.</p>
        </div>
      )}
    </div>
  );
}

// ─── Company Dashboard ────────────────────────────────────────────────────────

function CompanyDashboardView({ currentUser, requests, loading, onBrowse }: { currentUser: User; requests: InterviewRequest[]; loading: boolean; onBrowse: () => void }) {
  const pending = requests.filter((r) => r.status === "pending").length;
  const accepted = requests.filter((r) => r.status === "accepted").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start gap-4 mb-8 flex-wrap">
        <CompanyLogo name={currentUser.name} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{currentUser.name}</h1>
          <p className="text-sm text-muted-foreground">{currentUser.industry ?? "Company"} · Company Partner</p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
            <Building2 className="h-3 w-3" /> Verified Partner
          </span>
        </div>
        <button onClick={onBrowse} className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" /> Browse Talent
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Requests Sent", value: requests.length, color: "text-indigo-400" },
          { label: "Pending", value: pending, color: "text-amber-400" },
          { label: "Accepted", value: accepted, color: "text-teal-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={clsx("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 mb-6">
        <BadgeCheck className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300 leading-relaxed">
          As a Company Partner you can browse <strong>Verified Tutors only</strong> — students with 10+ sessions and a 4.2+ average rating. Tutors are notified instantly when you view their profile.
        </p>
      </div>

      <h2 className="text-lg font-bold mb-4">Interview Requests</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Briefcase className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No requests sent yet.</p>
          <button onClick={onBrowse} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Browse verified tutors →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 flex-wrap">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-sm">{req.tutorName}</p>
                  <StatusPill status={req.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{req.message}</p>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">{req.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Learner Dashboard ────────────────────────────────────────────────────────

function LearnerDashboardView({ currentUser, bookings, loading, onBrowse }: { currentUser: User; bookings: Booking[]; loading: boolean; onBrowse: () => void }) {
  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const past = bookings.filter((b) => b.status === "completed");
  const hoursLearned = bookings.filter((b) => b.status === "completed").reduce((acc, b) => acc + b.duration / 60, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {currentUser.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Here are your upcoming sessions</p>
        </div>
        <button onClick={onBrowse} className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" /> Find Tutors
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Upcoming", value: upcoming.length, color: "text-teal-400" },
          { label: "Completed", value: past.length, color: "text-purple-400" },
          { label: "Hours Learned", value: hoursLearned.toFixed(1), color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={clsx("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">Upcoming Sessions</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 mb-8">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading sessions...</span>
        </div>
      ) : upcoming.length > 0 ? (
        <div className="space-y-3 mb-8">
          {upcoming.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <div className="h-10 w-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.subject}</p>
                <p className="text-xs text-muted-foreground">with {s.tutorName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{s.date}</p>
                <p className="text-xs text-muted-foreground">{s.time} · {s.duration} min</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/25">Upcoming</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center mb-8">
          <p className="text-muted-foreground text-sm">No upcoming sessions. <button onClick={onBrowse} className="text-purple-400 hover:text-purple-300">Book one now →</button></p>
        </div>
      )}

      <h2 className="text-lg font-bold mb-4">Past Sessions</h2>
      <div className="space-y-3">
        {past.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap opacity-60">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{s.subject}</p>
              <p className="text-xs text-muted-foreground">with {s.tutorName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{s.date}</p>
              <p className="text-xs text-muted-foreground">{s.time} · {s.duration} min</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Completed</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tutor Dashboard ──────────────────────────────────────────────────────────

function TutorDashboardView({ currentUser, notifications, tutorBookings, loading, onMarkRead }: { currentUser: User; notifications: AppNotification[]; tutorBookings: Booking[]; loading: boolean; onMarkRead: () => void }) {
  const tutor = STATIC_TUTORS.find((t) => t.id === currentUser.id) ?? STATIC_TUTORS[0];
  const verified = isVerified(tutor);
  const unread = notifications.filter((n) => !n.read);
  const upcoming = tutorBookings.filter((b) => b.status === "upcoming");
  const monthlyEarnings = upcoming.reduce((acc, b) => acc + (b.earnings ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start gap-4 mb-8 flex-wrap">
        <Avatar tutor={tutor} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">{tutor.name}</h1>
            {verified && <VerifiedBadge size="md" />}
          </div>
          <p className="text-sm text-muted-foreground">{tutor.major} · {tutor.university}</p>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={tutor.rating} />
            <span className="text-xs text-muted-foreground font-mono">{tutor.sessionsCompleted} sessions</span>
          </div>
        </div>
      </div>

      {/* Company notifications */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold">Company Activity</h2>
              {unread.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">{unread.length} new</span>}
            </div>
            {unread.length > 0 && (
              <button onClick={onMarkRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Mark all read</button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={clsx("flex items-start gap-3 rounded-xl border p-3.5 transition-all", !n.read ? "bg-indigo-500/8 border-indigo-500/25" : "bg-card border-border opacity-60")}>
                <div className={clsx("h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0", n.type === "view" ? "bg-indigo-500/15" : "bg-teal-500/15")}>
                  {n.type === "view" ? <Eye className="h-3.5 w-3.5 text-indigo-400" /> : <Send className="h-3.5 w-3.5 text-teal-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm", !n.read ? "text-foreground font-medium" : "text-muted-foreground")}>{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified badge panel */}
      {verified ? (
        <div className="bg-gradient-to-r from-blue-950/80 to-blue-900/40 border border-blue-500/25 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-blue-300 mb-0.5">Verified Tutor Badge Active</p>
            <p className="text-sm text-blue-400/70">You have completed {tutor.sessionsCompleted} sessions with a {tutor.rating} average rating. Your blue badge is visible to learners and company recruiters.</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <p className="font-semibold text-sm">Path to Verified Tutor</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Complete 10 sessions with a 4.2+ average rating to earn your badge.</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Sessions</span><span className="font-mono">{tutor.sessionsCompleted}/10</span></div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (tutor.sessionsCompleted / 10) * 100)}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Avg rating</span><span className="font-mono">{tutor.rating.toFixed(1)} / 4.2 min</span></div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (tutor.rating / 4.2) * 100)}%` }} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Upcoming Earnings", value: `$${monthlyEarnings.toFixed(0)}`, icon: <DollarSign className="h-4 w-4 text-teal-400" />, bg: "bg-teal-500/10" },
          { label: "Sessions Done", value: tutor.sessionsCompleted, icon: <CheckCircle2 className="h-4 w-4 text-purple-400" />, bg: "bg-purple-500/10" },
          { label: "Avg. Rating", value: tutor.rating.toFixed(1), icon: <Star className="h-4 w-4 text-amber-400" />, bg: "bg-amber-500/10" },
          { label: "Upcoming", value: upcoming.length, icon: <Calendar className="h-4 w-4 text-blue-400" />, bg: "bg-blue-500/10" },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center mb-3", bg)}>{icon}</div>
            <p className="text-xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">Upcoming Sessions</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading sessions...</span>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">No upcoming sessions booked yet.</div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <div className="h-10 w-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0"><Calendar className="h-5 w-5 text-purple-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.subject}</p>
                <p className="text-xs text-muted-foreground">with {s.learnerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{s.date}</p>
                <p className="text-xs text-muted-foreground">{s.time} · {s.duration} min</p>
              </div>
              <span className="text-sm font-bold text-teal-400 font-mono">+${s.earnings?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Browse Tutors (learner) ───────────────────────────────────────────────────

function BrowseView({ tutors, onViewTutor, onBook, isLoggedIn, onLoginPrompt }: { tutors: Tutor[]; onViewTutor: (t: Tutor) => void; onBook: (t: Tutor) => void; isLoggedIn: boolean; onLoginPrompt: () => void }) {
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = tutors.filter((t) => {
    const matchesSkill = selectedSkill === "All" || t.skills.some((s) => s.toLowerCase().includes(selectedSkill.toLowerCase()));
    const matchesSearch = searchQuery === "" || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSkill && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Find Your Tutor</h1>
        <p className="text-sm text-muted-foreground">{tutors.length} tutors available now</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {ALL_SKILLS.map((skill) => (
          <button key={skill} onClick={() => setSelectedSkill(skill)} className={clsx("text-xs px-3 py-1.5 rounded-full border transition-all", selectedSkill === skill ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-purple-500/40")}>{skill}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} onView={() => onViewTutor(tutor)} onBook={() => isLoggedIn ? onBook(tutor) : onLoginPrompt()} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No tutors found for that search.</p>
        </div>
      )}
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingView({ tutors, onNavigate }: { tutors: Tutor[]; onNavigate: (view: View) => void }) {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-background to-teal-950/40 pointer-events-none" />
        <div className="absolute top-20 left-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs text-purple-300 mb-6">
            <Sparkles className="h-3 w-3" /> Peer learning for the next generation
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-5 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Learn from students<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">who actually get it.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">Connect with top-performing peers for 1-on-1 tutoring sessions. Real students, real experience, real results.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => onNavigate("learner-browse")} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">Find a Tutor <ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => onNavigate("signup")} className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:border-purple-500/40 transition-colors">Become a Tutor</button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 divide-x divide-border">
          {[{ value: "2,400+", label: "Active Tutors" }, { value: "18,000+", label: "Sessions Booked" }, { value: "4.8★", label: "Avg. Tutor Rating" }].map(({ value, label }) => (
            <div key={label} className="text-center px-4">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Why Growdemy?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Shield className="h-5 w-5 text-blue-400" />, title: "Verified Tutors", desc: "Top tutors earn a blue badge after 10 sessions with a 4.2+ average rating.", bg: "bg-blue-500/10" },
            { icon: <Calendar className="h-5 w-5 text-teal-400" />, title: "Instant Scheduling", desc: "Book sessions in seconds. Calendar invites go to both parties automatically.", bg: "bg-teal-500/10" },
            { icon: <DollarSign className="h-5 w-5 text-purple-400" />, title: "Fair Pricing", desc: "Sessions starting at $22/hr set by tutors. Pay only for the time you book.", bg: "bg-purple-500/10" },
            { icon: <Building2 className="h-5 w-5 text-indigo-400" />, title: "Company Partners", desc: "Companies browse verified tutors and send direct interview requests.", bg: "bg-indigo-500/10" },
          ].map(({ icon, title, desc, bg }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5">
              <div className={clsx("h-10 w-10 rounded-lg flex items-center justify-center mb-4", bg)}>{icon}</div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4"><Building2 className="h-3 w-3" /> For Companies</span>
              <h2 className="text-2xl font-bold mb-4">Hire from the top of the class</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">Growdemy Company Partners get exclusive access to browse Verified Tutors — the top-rated student instructors. Send interview requests directly. Students are notified the moment you view their profile.</p>
              <button onClick={() => onNavigate("signup")} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">Partner with Us <ArrowRight className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                { icon: <BadgeCheck className="h-4 w-4 text-blue-400" />, text: "Browse Verified Tutors only — pre-filtered for quality" },
                { icon: <Search className="h-4 w-4 text-indigo-400" />, text: "Filter by skill, subject, and university" },
                { icon: <Send className="h-4 w-4 text-teal-400" />, text: "Send direct interview requests with a custom message" },
                { icon: <Bell className="h-4 w-4 text-purple-400" />, text: "Students get notified instantly when you view their profile" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3 bg-background border border-border rounded-xl p-3.5">
                  <div className="h-7 w-7 rounded-lg bg-card flex items-center justify-center flex-shrink-0">{icon}</div>
                  <p className="text-sm text-muted-foreground leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Top Tutors This Week</h2>
          <button onClick={() => onNavigate("learner-browse")} className="text-sm text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1">View all <ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {tutors.slice(0, 3).map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} onView={() => onNavigate("learner-browse")} onBook={() => onNavigate("signup")} />
          ))}
        </div>
      </section>

      <section className="bg-card border-t border-border py-16 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Get started today</p>
        <h2 className="text-3xl font-bold mb-4">Ready to level up?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join thousands of students learning smarter with Growdemy.</p>
        <button onClick={() => onNavigate("signup")} className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">Get Started Free</button>
      </section>
    </div>
  );
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

function SignUpView({ onSignup, onGoLogin, loading, error }: { onSignup: (data: { name: string; email: string; password: string; role: Role; industry?: string }) => Promise<void>; onGoLogin: () => void; loading: boolean; error: string | null }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<Role>("learner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [industry, setIndustry] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSignup({ name, email, password, role: selectedRole, industry: industry || undefined });
  }

  const roles: { id: Role; label: string; desc: string; icon: React.ReactNode; bg: string }[] = [
    { id: "learner", label: "Learner", desc: "Book sessions with tutors", icon: <BookOpen className="h-4 w-4 text-teal-400" />, bg: "bg-teal-500/15" },
    { id: "tutor", label: "Tutor", desc: "Earn by teaching peers", icon: <Users className="h-4 w-4 text-purple-400" />, bg: "bg-purple-500/15" },
    { id: "company", label: "Company", desc: "Browse verified talent", icon: <Building2 className="h-4 w-4 text-indigo-400" />, bg: "bg-indigo-500/15" },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground">Already have one? <button onClick={onGoLogin} className="text-purple-400 hover:text-purple-300">Log in</button></p>
      </div>

      {step === 1 ? (
        <div>
          <p className="text-sm font-semibold text-center mb-4">I want to join as a...</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setSelectedRole(r.id)} className={clsx("p-4 rounded-xl border-2 text-left transition-all", selectedRole === r.id ? "border-primary bg-primary/10" : "border-border hover:border-purple-500/40")}>
                <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center mb-2.5", r.bg)}>{r.icon}</div>
                <p className="font-semibold text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{r.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Continue as {roles.find((r) => r.id === selectedRole)?.label}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="text-sm font-semibold block mb-1.5">{selectedRole === "company" ? "Company Name" : "Full Name"}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={selectedRole === "company" ? "Stripe, Inc." : "Alex Morgan"} required className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">{selectedRole === "company" ? "Work Email" : "University Email"}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={selectedRole === "company" ? "you@company.com" : "you@university.edu"} required className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          {selectedRole === "tutor" && (
            <div>
              <label className="text-sm font-semibold block mb-1.5">Primary Subject</label>
              <input type="text" placeholder="e.g. Computer Science, Mathematics" className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>
          )}
          {selectedRole === "company" && (
            <div>
              <label className="text-sm font-semibold block mb-1.5">Industry</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Fintech, Healthcare, SaaS" className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
          </button>
          <p className="text-xs text-muted-foreground text-center">By signing up you agree to our Terms of Service and Privacy Policy.</p>
        </form>
      )}
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginView({ onLogin, onDemo, onGoSignup, loading, error }: { onLogin: (email: string, password: string) => Promise<void>; onDemo: (role: Role) => void; onGoSignup: () => void; loading: boolean; error: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onLogin(email, password);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground">No account? <button onClick={onGoSignup} className="text-purple-400 hover:text-purple-300">Sign up free</button></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        {error && <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
        <div>
          <label className="text-sm font-semibold block mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" required className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging in...</> : "Log In"}
        </button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or try a demo</span></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onDemo("learner")} className="py-2.5 rounded-lg border border-teal-500/30 text-teal-400 text-xs font-semibold hover:bg-teal-500/10 transition-colors">Learner</button>
        <button onClick={() => onDemo("tutor")} className="py-2.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs font-semibold hover:bg-purple-500/10 transition-colors">Tutor</button>
        <button onClick={() => onDemo("company")} className="py-2.5 rounded-lg border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/10 transition-colors">Company</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState<View>("landing");
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [bookingTutor, setBookingTutor] = useState<Tutor | null>(null);

  const [tutors, setTutors] = useState<Tutor[]>(STATIC_TUTORS);
  const [learnerBookings, setLearnerBookings] = useState<Booking[]>([]);
  const [tutorBookings, setTutorBookings] = useState<Booking[]>([]);
  const [companyRequests, setCompanyRequests] = useState<InterviewRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const role = currentUser?.role ?? null;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load tutors on mount
  useEffect(() => {
    api.tutors.list().then(({ tutors: t }) => setTutors(t as Tutor[])).catch(() => {});
  }, []);

  // Load dashboard data when view or user changes
  useEffect(() => {
    if (!currentUser) return;

    if (view === "learner-dashboard") {
      setDataLoading(true);
      api.bookings.forLearner(currentUser.id)
        .then(({ bookings }) => setLearnerBookings(bookings))
        .catch(() => {})
        .finally(() => setDataLoading(false));
    }

    if (view === "tutor-dashboard") {
      setDataLoading(true);
      Promise.all([
        api.notifications.get(currentUser.id).then(({ notifications: n }) => setNotifications(n)),
        api.bookings.forTutor(currentUser.id).then(({ bookings }) => setTutorBookings(bookings)),
      ]).catch(() => {}).finally(() => setDataLoading(false));
    }

    if (view === "company-dashboard") {
      setDataLoading(true);
      api.interviewRequests.forCompany(currentUser.id)
        .then(({ requests }) => setCompanyRequests(requests))
        .catch(() => {})
        .finally(() => setDataLoading(false));
    }
  }, [view, currentUser?.id]);

  function navigate(nextView: View) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveUser(user: User) {
    setCurrentUser(user);
    localStorage.setItem("growdemy_user", JSON.stringify(user));
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("growdemy_user");
    setView("landing");
    setLearnerBookings([]);
    setTutorBookings([]);
    setCompanyRequests([]);
    setNotifications([]);
  }

  async function handleSignup(data: { name: string; email: string; password: string; role: Role; industry?: string }) {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { user } = await api.auth.signup(data);
      saveUser(user);
      navigate(user.role === "learner" ? "learner-dashboard" : user.role === "tutor" ? "tutor-dashboard" : "company-dashboard");
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { user } = await api.auth.login(email, password);
      saveUser(user);
      navigate(user.role === "learner" ? "learner-dashboard" : user.role === "tutor" ? "tutor-dashboard" : "company-dashboard");
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function loginDemo(demoRole: Role) {
    saveUser(DEMO_USERS[demoRole]);
    navigate(demoRole === "learner" ? "learner-dashboard" : demoRole === "tutor" ? "tutor-dashboard" : "company-dashboard");
  }

  async function handleBook(tutor: Tutor, date: string, time: string, duration: number) {
    if (!currentUser) return;
    const earnings = (tutor.hourlyRate * duration) / 60;
    const { booking } = await api.bookings.create({
      learnerId: currentUser.id,
      tutorId: tutor.id,
      tutorName: tutor.name,
      subject: tutor.skills[0],
      date, time, duration, earnings,
    });
    setLearnerBookings((prev) => [booking, ...prev]);
  }

  async function handleCompanyViewTutor(tutor: Tutor) {
    setSelectedTutor(tutor);
    setView("company-tutor-profile");
    try {
      await api.notifications.create(tutor.id, `${currentUser?.name ?? "A company"} viewed your profile`, "view");
    } catch {}
  }

  async function handleInterviewRequest(tutor: Tutor, message: string) {
    if (!currentUser) return;
    const { request } = await api.interviewRequests.send({
      companyId: currentUser.id,
      companyName: currentUser.name,
      companyIndustry: currentUser.industry ?? "",
      tutorId: tutor.id,
      tutorName: tutor.name,
      message,
    });
    setCompanyRequests((prev) => [request, ...prev]);
    navigate("company-dashboard");
  }

  async function handleMarkNotificationsRead() {
    if (!currentUser) return;
    try {
      await api.notifications.markAllRead(currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }

  // ── Overlay views ──────────────────────────────────────────────────────────

  if (view === "company-tutor-profile" && selectedTutor) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav currentUser={currentUser} unreadCount={unreadCount} onNavigate={navigate} onLogout={logout} />
        <CompanyTutorProfileView
          tutor={selectedTutor}
          companyName={currentUser?.name ?? "Your Company"}
          onBack={() => setView("company-browse")}
          onRequestSent={(message) => handleInterviewRequest(selectedTutor, message)}
        />
      </div>
    );
  }

  if (bookingTutor) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav currentUser={currentUser} unreadCount={unreadCount} onNavigate={(v) => { setBookingTutor(null); navigate(v); }} onLogout={logout} />
        <BookSessionView
          tutor={bookingTutor}
          onBack={() => setBookingTutor(null)}
          onBook={(date, time, duration) => handleBook(bookingTutor, date, time, duration)}
        />
      </div>
    );
  }

  if (view === "tutor-profile" && selectedTutor) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav currentUser={currentUser} unreadCount={unreadCount} onNavigate={navigate} onLogout={logout} />
        <TutorProfileView
          tutor={selectedTutor}
          onBack={() => setView("learner-browse")}
          onBook={() => role === "learner" ? setBookingTutor(selectedTutor) : navigate("signup")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav currentUser={currentUser} unreadCount={unreadCount} onNavigate={navigate} onLogout={logout} />

      {view === "landing" && <LandingView tutors={tutors} onNavigate={navigate} />}

      {view === "signup" && (
        <SignUpView
          onSignup={handleSignup}
          onGoLogin={() => { setAuthError(null); navigate("login"); }}
          loading={authLoading}
          error={authError}
        />
      )}

      {view === "login" && (
        <LoginView
          onLogin={handleLogin}
          onDemo={loginDemo}
          onGoSignup={() => { setAuthError(null); navigate("signup"); }}
          loading={authLoading}
          error={authError}
        />
      )}

      {view === "learner-browse" && (
        <BrowseView
          tutors={tutors}
          onViewTutor={(tutor) => { setSelectedTutor(tutor); setView("tutor-profile"); }}
          onBook={(tutor) => setBookingTutor(tutor)}
          isLoggedIn={role === "learner"}
          onLoginPrompt={() => navigate("signup")}
        />
      )}

      {view === "learner-dashboard" && currentUser && (
        <LearnerDashboardView
          currentUser={currentUser}
          bookings={learnerBookings}
          loading={dataLoading}
          onBrowse={() => setView("learner-browse")}
        />
      )}

      {view === "tutor-dashboard" && currentUser && (
        <TutorDashboardView
          currentUser={currentUser}
          notifications={notifications}
          tutorBookings={tutorBookings}
          loading={dataLoading}
          onMarkRead={handleMarkNotificationsRead}
        />
      )}

      {view === "company-browse" && (
        <CompanyBrowseView tutors={tutors} onViewTutor={handleCompanyViewTutor} />
      )}

      {view === "company-dashboard" && currentUser && (
        <CompanyDashboardView
          currentUser={currentUser}
          requests={companyRequests}
          loading={dataLoading}
          onBrowse={() => setView("company-browse")}
        />
      )}
    </div>
  );
}
