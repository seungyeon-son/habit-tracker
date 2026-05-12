import { useState, useEffect } from 'react';
import { CircularProgress } from './components/CircularProgress';
import { WeeklyProgressBar } from './components/WeeklyProgressBar';
import { AddHabitDialog } from './components/AddHabitDialog';
import { WeeklySharedGoals, getNextGoalColor } from './components/WeeklySharedGoals';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Calendar, TrendingUp, LayoutGrid } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  color: string;
}

interface SharedGoal {
  id: string;
  name: string;
  color: string;
}

interface HabitCompletion {
  habitId: string;
  date: string;
  completed: boolean;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const HABIT_COLORS = [
  '#6B8DD6',
  '#F2C94C',
  '#B77CCD',
  '#5FC9B3',
  '#F37E5F',
  '#E991BC',
  '#8BC34A',
  '#FF9A76',
];

function getDayOfWeek(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDay();
  return DAYS[day === 0 ? 6 : day - 1];
}

function getNextColor(existingHabits: Habit[]) {
  const usedColors = existingHabits.map(h => h.color);
  const availableColor = HABIT_COLORS.find(color => !usedColors.includes(color));
  return availableColor || HABIT_COLORS[existingHabits.length % HABIT_COLORS.length];
}

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split('T')[0];
  });
}

function getWeekStartDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  return monday.toISOString().split('T')[0];
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function formatWeekLabel(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mo = monday.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  const su = sunday.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  return `${mo} ~ ${su}`;
}

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: '물 8잔 마시기', color: HABIT_COLORS[0] },
    { id: '2', name: '30분 운동하기', color: HABIT_COLORS[1] },
    { id: '3', name: '독서 30분', color: HABIT_COLORS[2] },
  ]);

  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

  // Weekly shared goals state
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([
    { id: 'sg1', name: '함께 산책 3회 이상', color: '#5B8FF9' },
    { id: 'sg2', name: '주 1회 외식 계획 세우기', color: '#61D4A4' },
    { id: 'sg3', name: '독서 모임 참여하기', color: '#F6A623' },
  ]);

  // Completed goal IDs per week key
  const [goalCompletions, setGoalCompletions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const savedCompletions = localStorage.getItem('habit-completions');
    if (savedCompletions) setCompletions(JSON.parse(savedCompletions));
    const savedGoalCompletions = localStorage.getItem('goal-completions');
    if (savedGoalCompletions) setGoalCompletions(JSON.parse(savedGoalCompletions));
    const savedSharedGoals = localStorage.getItem('shared-goals');
    if (savedSharedGoals) setSharedGoals(JSON.parse(savedSharedGoals));
  }, []);

  useEffect(() => {
    localStorage.setItem('habit-completions', JSON.stringify(completions));
  }, [completions]);

  useEffect(() => {
    localStorage.setItem('goal-completions', JSON.stringify(goalCompletions));
  }, [goalCompletions]);

  useEffect(() => {
    localStorage.setItem('shared-goals', JSON.stringify(sharedGoals));
  }, [sharedGoals]);

  const today = getTodayDate();
  const weekKey = getWeekStartDate();
  const currentWeekCompletedIds = goalCompletions[weekKey] ?? [];

  const handleToggleHabit = (habitId: string, checked: boolean) => {
    setCompletions(prev => {
      const existing = prev.find(c => c.habitId === habitId && c.date === today);
      if (existing) {
        return prev.map(c => c.habitId === habitId && c.date === today ? { ...c, completed: checked } : c);
      }
      return [...prev, { habitId, date: today, completed: checked }];
    });
  };

  const addHabit = (name: string) => {
    setHabits([...habits, { id: Date.now().toString(), name, color: getNextColor(habits) }]);
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    setCompletions(completions.filter(c => c.habitId !== id));
  };

  const handleToggleGoal = (goalId: string) => {
    setGoalCompletions(prev => {
      const current = prev[weekKey] ?? [];
      const updated = current.includes(goalId)
        ? current.filter(id => id !== goalId)
        : [...current, goalId];
      return { ...prev, [weekKey]: updated };
    });
  };

  const addSharedGoal = (name: string) => {
    const newGoal: SharedGoal = {
      id: Date.now().toString(),
      name,
      color: getNextGoalColor(sharedGoals),
    };
    setSharedGoals([...sharedGoals, newGoal]);
  };

  const deleteSharedGoal = (id: string) => {
    setSharedGoals(sharedGoals.filter(g => g.id !== id));
    setGoalCompletions(prev => {
      const updated = { ...prev };
      for (const k of Object.keys(updated)) {
        updated[k] = updated[k].filter(gid => gid !== id);
      }
      return updated;
    });
  };

  const weekDates = getWeekDates();
  const weekProgressData = weekDates.map((date) => {
    const dayCompletions = completions.filter(c => c.date === date && c.completed);
    const completed = dayCompletions.length;
    const total = habits.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const segments = habits.map(habit => {
      const isCompleted = completions.some(c => c.habitId === habit.id && c.date === date && c.completed);
      return { color: habit.color, width: isCompleted ? (100 / total) : 0 };
    }).filter(seg => seg.width > 0);
    return { day: getDayOfWeek(date), percentage, completed, total, isToday: date === today, segments };
  });

  const todayCompletions = completions.filter(c => c.date === today && c.completed).length;
  const progress = habits.length > 0 ? Math.round((todayCompletions / habits.length) * 100) : 0;
  const circularSegments = habits.map(habit => {
    const isCompleted = completions.some(c => c.habitId === habit.id && c.date === today && c.completed);
    return { color: habit.color, percentage: isCompleted ? (100 / habits.length) : 0 };
  }).filter(seg => seg.percentage > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-1">습관 대시보드</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <p className="text-sm">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
              })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="today" className="flex-1 gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              오늘
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              주간
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              분석
            </TabsTrigger>
          </TabsList>

          {/* ── 오늘 탭 ── */}
          <TabsContent value="today" className="space-y-4 mt-0">

            {/* 주간공동목표 — TOP of 오늘 tab */}
            <WeeklySharedGoals
              goals={sharedGoals}
              completedIds={currentWeekCompletedIds}
              onToggle={handleToggleGoal}
              onAdd={addSharedGoal}
              onDelete={deleteSharedGoal}
              weekLabel={formatWeekLabel()}
            />

            {/* 오늘의 습관 */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="m-0">오늘의 습관</h3>
                    <span className="text-sm text-muted-foreground">({todayCompletions}/{habits.length})</span>
                  </div>
                  <AddHabitDialog onAdd={addHabit} />
                </div>
              </div>
              <div className="px-3 pb-3 space-y-1">
                {habits.map(habit => {
                  const completion = completions.find(c => c.habitId === habit.id && c.date === today);
                  return (
                    <div
                      key={habit.id}
                      className="group flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleToggleHabit(habit.id, !(completion?.completed || false))}
                    >
                      <button
                        className="flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                        style={{
                          backgroundColor: completion?.completed ? habit.color : 'transparent',
                          borderColor: habit.color,
                          transform: completion?.completed ? 'scale(0.92)' : 'scale(1)',
                        }}
                        onClick={(e) => { e.stopPropagation(); handleToggleHabit(habit.id, !(completion?.completed || false)); }}
                      >
                        {completion?.completed && (
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm transition-all duration-200 \${completion?.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {habit.name}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
                {habits.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    새 습관을 추가하여 시작하세요
                  </div>
                )}
              </div>
            </div>

            {/* 오늘의 진행률 링 */}
            <div className="rounded-2xl bg-card border border-border p-8">
              <div className="flex items-center justify-center mb-4">
                <CircularProgress
                  percentage={progress}
                  completed={todayCompletions}
                  total={habits.length}
                  segments={circularSegments}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">오늘의 진행률</p>
              </div>
            </div>
          </TabsContent>

          {/* ── 주간 탭 ── */}
          <TabsContent value="weekly" className="space-y-4 mt-0">
            <div className="rounded-2xl bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-chart-1" />
                <h3 className="m-0">주간 진행도</h3>
              </div>
              <WeeklyProgressBar data={weekProgressData} />
            </div>

            {/* Weekly goal summary */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#5B8FF9'}}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                <h3 className="m-0">이번 주 공동 목표 현황</h3>
              </div>
              <div className="space-y-3">
                {sharedGoals.map(goal => {
                  const done = currentWeekCompletedIds.includes(goal.id);
                  return (
                    <div key={goal.id} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: done ? goal.color : undefined, border: \`2px solid \${goal.color}\` }}
                      />
                      <span className={`text-sm flex-1 \${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {goal.name}
                      </span>
                      {done && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: goal.color }}>완료</span>
                      )}
                    </div>
                  );
                })}
                {sharedGoals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">공동 목표가 없습니다</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── 분석 탭 ── */}
          <TabsContent value="stats" className="space-y-4 mt-0">
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="m-0 mb-4">습관 달성 현황</h3>
              <div className="space-y-4">
                {habits.map(habit => {
                  const weeklyCount = weekDates.filter(d =>
                    completions.some(c => c.habitId === habit.id && c.date === d && c.completed)
                  ).length;
                  const pct = Math.round((weeklyCount / 7) * 100);
                  return (
                    <div key={habit.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                          <span>{habit.name}</span>
                        </div>
                        <span className="text-muted-foreground">{weeklyCount}/7일</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `\${pct}%`, backgroundColor: habit.color }}
                        />
                      </div>
                    </div>
                  );
                })}
                {habits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">등록된 습관이 없습니다</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="m-0 mb-2">이번 주 요약</h3>
              <p className="text-sm text-muted-foreground mb-4">{formatWeekLabel()}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted p-3 text-center">
                  <p className="text-2xl font-semibold">{habits.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">전체 습관</p>
                </div>
                <div className="rounded-xl bg-muted p-3 text-center">
                  <p className="text-2xl font-semibold">{sharedGoals.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">공동 목표</p>
                </div>
                <div className="rounded-xl bg-muted p-3 text-center">
                  <p className="text-2xl font-semibold">{currentWeekCompletedIds.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">목표 달성</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
