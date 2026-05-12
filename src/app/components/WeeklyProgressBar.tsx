interface HabitSegment {
  color: string;
  width: number;
}

interface DayProgress {
  day: string;
  percentage: number;
  completed: number;
  total: number;
  isToday: boolean;
  segments: HabitSegment[];
}

interface WeeklyProgressBarProps {
  data: DayProgress[];
}

export function WeeklyProgressBar({ data }: WeeklyProgressBarProps) {
  return (
    <div className="space-y-3">
      {data.map((day, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className={`${day.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              {day.day}
            </span>
            <span className="text-muted-foreground">
              {day.completed}/{day.total}
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
            {day.segments.map((segment, segIdx) => (
              <div
                key={segIdx}
                className="h-full transition-all duration-500 ease-out"
                style={{
                  backgroundColor: segment.color,
                  width: `${segment.width}%`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
