import { Check, Trash2 } from 'lucide-react';

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    icon?: string;
    color: string;
  };
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
}

export function HabitCard({ habit, checked, onToggle, onDelete }: HabitCardProps) {
  return (
    <div
      className="relative group rounded-2xl p-5 border border-border transition-all duration-300 hover:shadow-lg bg-card"
      onClick={() => onToggle(!checked)}
    >
      <div className="flex items-center gap-4">
        <button
          className="flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: checked ? habit.color : 'transparent',
            borderColor: habit.color,
            transform: checked ? 'scale(0.95)' : 'scale(1)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(!checked);
          }}
        >
          {checked && <Check className="w-6 h-6 text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-base transition-all duration-300 ${
            checked ? 'text-muted-foreground line-through' : 'text-foreground'
          }`}>
            {habit.name}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex-shrink-0 p-2 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
