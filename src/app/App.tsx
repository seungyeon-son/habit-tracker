import { useState, useEffect } from "react";
import { CircularProgress } from "./components/CircularProgress";
import { WeeklyDots } from "./components/WeeklyDots";
import { AddHabitDialog } from "./components/AddHabitDialog";
import { AuthButton } from "./components/AuthButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Calendar, TrendingUp, CalendarDays, BarChart2, Trash2 } from "lucide-react";
import { auth, db, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// ── Types ──────────────────────────────────────────────────────────────────

type Category = "유지루틴" | "생산성개선";

interface Habit {
  id: string;
  name: string;
  category: Category;
  color: string;
}

interface HabitCompletion {
  habitId: string;
  date: string;
  completed: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const HABIT_COLORS = [
  "#6B8DD6", "#5FC9B3", "#F2C94C", "#B77CCD",
  "#F37E5F", "#E991BC", "#8BC34A", "#FF9A76",
];

const DEFAULT_HABITS: Habit[] = [
  { id: "routine-1", name: "다이어리쓰기", category: "유지루틴",    color: "#6B8DD6" },
  { id: "routine-2", name: "독서",          category: "유지루틴",    color: "#5FC9B3" },
  { id: "routine-3", name: "최소지출",      category: "유지루틴",    color: "#F2C94C" },
  { id: "prod-1",    name: "생각구독-배움", category: "생산성개선",  color: "#B77CCD" },
  { id: "prod-2",    name: "운동",          category: "생산성개선",  color: "#F37E5F" },
  { id: "prod-3",    name: "클로드사용",    category: "생산성개선",  color: "#E991BC" },
];

const CATEGORY_COLOR: Record<Category, string> = {
  "유지루틴":   "#5B8FF9",
  "생산성개선": "#61D4A4",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getWeekDates(offset = 0): string[] {
  const ref = new Date();
  ref.setDate(ref.getDate() + offset * 7);
  const day = ref.getDay();
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatDateRange(dates: string[]) {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return `${fmt(dates[0])} ~ ${fmt(dates[6])}`;
}

function getNextColor(habits: Habit[]) {
  const used = new Set(habits.map((h) => h.color));
  return HABIT_COLORS.find((c) => !used.has(c)) ?? HABIT_COLORS[habits.length % HABIT_COLORS.length];
}

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]               = useState<User | null>(null);
  const [firestoreReady, setFirestoreReady] = useState(false);
  const [habits, setHabits]           = useState<Habit[]>(() => loadLocal("habits-v2", DEFAULT_HABITS));
  const [completions, setCompletions] = useState<HabitCompletion[]>(() => loadLocal("habit-completions", []));
  const [weekOffset, setWeekOffset]   = useState(0);

  // ── 로그아웃 상태에서만 localStorage에 저장 ────────────────────────────
  useEffect(() => {
    if (!user) localStorage.setItem("habits-v2", JSON.stringify(habits));
  }, [habits, user]);

  useEffect(() => {
    if (!user) localStorage.setItem("habit-completions", JSON.stringify(completions));
  }, [completions, user]);

  // ── Firebase auth ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      if (u && db) {
        // Firestore 로딩 완료 전까지 sync 차단 (race condition 방지)
        setFirestoreReady(false);
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as { habits?: Habit[]; completions?: HabitCompletion[] };
          if (data.habits)      setHabits(data.habits);
          if (data.completions) setCompletions(data.completions);
        } else {
          // 최초 로그인: 현재 로컬 데이터를 Firestore에 업로드
          const localHabits      = loadLocal<Habit[]>("habits-v2", DEFAULT_HABITS);
          const localCompletions = loadLocal<HabitCompletion[]>("habit-completions", []);
          await setDoc(ref, { habits: localHabits, completions: localCompletions });
          setHabits(localHabits);
          setCompletions(localCompletions);
        }
        setUser(u);
        setFirestoreReady(true); // 이 시점부터 sync 허용
      } else {
        // 로그아웃: 로컬(비로그인) 데이터로 복원
        setFirestoreReady(false);
        setUser(null);
        setHabits(loadLocal("habits-v2", DEFAULT_HABITS));
        setCompletions(loadLocal("habit-completions", []));
      }
    });
  }, []);

  // ── Firestore 동기화 (firestoreReady 이후에만 실행) ───────────────────
  useEffect(() => {
    if (!user || !db || !firestoreReady) return;
    const ref = doc(db, "users", user.uid);
    setDoc(ref, { habits, completions }, { merge: true });
  }, [habits, completions, user, firestoreReady]);

  // ── Auth actions ─────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      // popup + postMessage 방식: sessionStorage 불필요, iOS Safari 호환
      await signInWithPopup(auth, googleProvider);
    } catch (err) { console.error("Google sign-in failed:", err); }
  };
  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    // 상태 초기화는 onAuthStateChanged의 else 분기에서 처리
  };

  // ── Habit actions ─────────────────────────────────────────────────────────
  const toggleHabit = (habitId: string, date: string) => {
    setCompletions((prev) => {
      const idx = prev.findIndex((c) => c.habitId === habitId && c.date === date);
      if (idx >= 0) {
        return prev.map((c, i) => i === idx ? { ...c, completed: !c.completed } : c);
      }
      return [...prev, { habitId, date, completed: true }];
    });
  };

  const addHabit = (name: string, category: Category) => {
    setHabits((prev) => [
      ...prev,
      { id: Date.now().toString(), name, category, color: getNextColor(prev) },
    ]);
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setCompletions((prev) => prev.filter((c) => c.habitId !== id));
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const today     = getTodayDate();
  const weekDates = getWeekDates(weekOffset);

  const routineHabits      = habits.filter((h) => h.category === "유지루틴");
  const productivityHabits = habits.filter((h) => h.category === "생산성개선");

  const todayDone  = completions.filter((c) => c.date === today && c.completed).length;
  const todayTotal = habits.length;
  const progress   = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const circularSegments = habits
    .map((h) => ({
      color:      h.color,
      percentage: completions.some((c) => c.habitId === h.id && c.date === today && c.completed)
        ? 100 / todayTotal
        : 0,
    }))
    .filter((s) => s.percentage > 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1">습관 대시보드</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">
                {new Date().toLocaleDateString("ko-KR", {
                  year: "numeric", month: "long", day: "numeric", weekday: "long",
                })}
              </p>
            </div>
          </div>
          <AuthButton user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="today"   className="flex-1 gap-1.5">
              <Calendar       className="w-3.5 h-3.5" /> 오늘
            </TabsTrigger>
            <TabsTrigger value="weekly"  className="flex-1 gap-1.5">
              <TrendingUp     className="w-3.5 h-3.5" /> 주간
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 gap-1.5">
              <CalendarDays   className="w-3.5 h-3.5" /> 월간
            </TabsTrigger>
            <TabsTrigger value="yearly"  className="flex-1 gap-1.5">
              <BarChart2      className="w-3.5 h-3.5" /> 연간
            </TabsTrigger>
          </TabsList>

          {/* ── 오늘 탭 ── */}
          <TabsContent value="today" className="space-y-4 mt-0">
            {/* Circular progress */}
            <div className="rounded-2xl bg-card border border-border p-8">
              <div className="flex items-center justify-center mb-3">
                <CircularProgress
                  percentage={progress}
                  completed={todayDone}
                  total={todayTotal}
                  segments={circularSegments}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">오늘의 진행률</p>
            </div>

            {/* 유지루틴 */}
            <HabitCategory
              title="유지루틴"
              color={CATEGORY_COLOR["유지루틴"]}
              habits={routineHabits}
              completions={completions}
              date={today}
              onToggle={(id) => toggleHabit(id, today)}
              onAdd={(name) => addHabit(name, "유지루틴")}
              onDelete={deleteHabit}
            />

            {/* 생산성개선 */}
            <HabitCategory
              title="생산성개선"
              color={CATEGORY_COLOR["생산성개선"]}
              habits={productivityHabits}
              completions={completions}
              date={today}
              onToggle={(id) => toggleHabit(id, today)}
              onAdd={(name) => addHabit(name, "생산성개선")}
              onDelete={deleteHabit}
            />
          </TabsContent>

          {/* ── 주간 탭 ── */}
          <TabsContent value="weekly" className="space-y-4 mt-0">
            {/* Week navigation */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="px-3 py-1.5 rounded-lg hover:bg-accent text-sm text-muted-foreground transition-colors"
              >
                ← 이전 주
              </button>
              <span className="text-sm font-medium">{formatDateRange(weekDates)}</span>
              <button
                onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
                disabled={weekOffset >= 0}
                className="px-3 py-1.5 rounded-lg hover:bg-accent text-sm text-muted-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                다음 주 →
              </button>
            </div>

            {/* 유지루틴 dots */}
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLOR["유지루틴"] }} />
                <h3 className="m-0 text-sm font-semibold" style={{ color: CATEGORY_COLOR["유지루틴"] }}>유지루틴</h3>
              </div>
              <WeeklyDots
                habits={routineHabits}
                completions={completions}
                weekDates={weekDates}
                today={today}
                onToggle={toggleHabit}
              />
            </div>

            {/* 생산성개선 dots */}
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLOR["생산성개선"] }} />
                <h3 className="m-0 text-sm font-semibold" style={{ color: CATEGORY_COLOR["생산성개선"] }}>생산성개선</h3>
              </div>
              <WeeklyDots
                habits={productivityHabits}
                completions={completions}
                weekDates={weekDates}
                today={today}
                onToggle={toggleHabit}
              />
            </div>
          </TabsContent>

          {/* ── 월간 탭 (준비 중) ── */}
          <TabsContent value="monthly" className="mt-0">
            <div className="rounded-2xl bg-card border border-border p-14 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="m-0 mb-2">월간 통계</h3>
              <p className="text-muted-foreground text-sm">준비 중입니다</p>
            </div>
          </TabsContent>

          {/* ── 연간 탭 (준비 중) ── */}
          <TabsContent value="yearly" className="mt-0">
            <div className="rounded-2xl bg-card border border-border p-14 text-center">
              <BarChart2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="m-0 mb-2">연간 통계</h3>
              <p className="text-muted-foreground text-sm">준비 중입니다</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── HabitCategory ──────────────────────────────────────────────────────────

interface HabitCategoryProps {
  title: string;
  color: string;
  habits: Habit[];
  completions: HabitCompletion[];
  date: string;
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

function HabitCategory({
  title, color, habits, completions, date, onToggle, onAdd, onDelete,
}: HabitCategoryProps) {
  const completedCount = habits.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === date && c.completed),
  ).length;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="m-0 text-base">{title}</h3>
            <span className="text-sm text-muted-foreground">
              ({completedCount}/{habits.length})
            </span>
          </div>
          <AddHabitDialog onAdd={onAdd} categoryLabel={title} />
        </div>
      </div>

      <div className="px-3 pb-3 space-y-1">
        {habits.map((habit) => {
          const done = completions.some(
            (c) => c.habitId === habit.id && c.date === date && c.completed,
          );
          return (
            <div
              key={habit.id}
              className="group flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onToggle(habit.id)}
            >
              <button
                className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: done ? habit.color : "transparent",
                  borderColor: habit.color,
                  transform: done ? "scale(0.92)" : "scale(1)",
                }}
                onClick={(e) => { e.stopPropagation(); onToggle(habit.id); }}
              >
                {done && (
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              <span className={`flex-1 text-sm transition-all duration-200 ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {habit.name}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
                className="flex-shrink-0 p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            추가 버튼으로 새 항목을 등록하세요
          </div>
        )}
      </div>
    </div>
  );
}
