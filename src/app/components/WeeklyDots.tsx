const DAYS_KO = ['월', '화', '수', '목', '금', '토', '일'];

interface Habit {
  id: string;
  name: string;
  color: string;
}

interface HabitCompletion {
  habitId: string;
  date: string;
  completed: boolean;
}

interface WeeklyDotsProps {
  habits: Habit[];
  completions: HabitCompletion[];
  weekDates: string[];
  today: string;
  onToggle: (habitId: string, date: string) => void;
}

export function WeeklyDots({ habits, completions, weekDates, today, onToggle }: WeeklyDotsProps) {
  if (habits.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">항목이 없습니다</p>;
  }

  return (
    <div>
      {/* Day headers */}
      <div className="flex items-center mb-3">
        <div className="w-28 flex-shrink-0" />
        {weekDates.map((date, i) => (
          <div
            key={date}
            className={`flex-1 text-center text-xs font-medium ${
              date === today ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {DAYS_KO[i]}
          </div>
        ))}
      </div>

      {/* Habit rows */}
      <div className="space-y-2.5">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center">
            <div className="w-28 flex-shrink-0 flex items-center gap-1.5 pr-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: habit.color }}
              />
              <span className="text-xs text-foreground truncate">{habit.name}</span>
            </div>
            {weekDates.map((date) => {
              const done = completions.some(
                (c) => c.habitId === habit.id && c.date === date && c.completed,
              );
              const isFuture = date > today;
              const isToday = date === today;

              return (
                <div key={date} className="flex-1 flex justify-center">
                  <button
                    onClick={() => !isFuture && onToggle(habit.id, date)}
                    disabled={isFuture}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isFuture
                        ? 'opacity-20 cursor-not-allowed'
                        : 'cursor-pointer hover:scale-110 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: done ? habit.color : 'transparent',
                      borderColor: habit.color,
                      outline: isToday ? `2px solid ${habit.color}` : undefined,
                      outlineOffset: isToday ? '2px' : undefined,
                    }}
                  >
                    {done && (
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
