interface HabitSegment {
  color: string;
  percentage: number;
}

interface CircularProgressProps {
  percentage: number;
  completed: number;
  total: number;
  segments: HabitSegment[];
}

export function CircularProgress({ percentage, completed, total, segments }: CircularProgressProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="240" height="240" className="-rotate-90">
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="20"
        />
        {segments.map((segment, index) => {
          const segmentLength = (segment.percentage / 100) * circumference;
          const offset = currentOffset;
          currentOffset += segmentLength;

          return (
            <circle
              key={index}
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="20"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-6xl font-semibold text-foreground">{percentage}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {completed} OF {total}
        </div>
      </div>
    </div>
  );
}
