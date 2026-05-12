import { Check, Target, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface SharedGoal {
  id: string;
  name: string;
  color: string;
}

interface WeeklySharedGoalsProps {
  goals: SharedGoal[];
  completedIds: string[];
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  weekLabel: string;
}

const GOAL_COLORS = [
  '#5B8FF9',
  '#61D4A4',
  '#F6A623',
  '#E86C5D',
  '#9B7EDE',
  '#4DC9C2',
  '#F9C851',
  '#E991BC',
];

function getNextGoalColor(goals: SharedGoal[]): string {
  const used = goals.map(g => g.color);
  return GOAL_COLORS.find(c => !used.includes(c)) ?? GOAL_COLORS[goals.length % GOAL_COLORS.length];
}

function AddGoalDialog({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      setOpen(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent">
          <Plus className="w-3.5 h-3.5" />
          목표 추가
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 bg-popover rounded-2xl border border-border shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="m-0 text-base">공동 목표 추가</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이번 주 공동 목표를 입력하세요"
              className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring mb-4 text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm">
                  취소
                </button>
              </Dialog.Close>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm">
                추가
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function WeeklySharedGoals({ goals, completedIds, onToggle, onAdd, onDelete, weekLabel }: WeeklySharedGoalsProps) {
  const completedCount = completedIds.length;
  const totalCount = goals.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = (name: string) => {
    onAdd(name);
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="m-0 leading-tight">주간 공동 목표</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{weekLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tabular-nums">
              <span style={{ color: completedCount > 0 ? '#5B8FF9' : undefined }}>{completedCount}</span>
              <span className="text-muted-foreground">/{totalCount}</span>
            </span>
            <AddGoalDialog onAdd={handleAdd} />
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #5B8FF9, #61D4A4)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Goals list */}
      <div className="px-3 pb-3 space-y-1">
        {goals.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            이번 주 공동 목표를 추가해보세요
          </div>
        )}
        {goals.map((goal) => {
          const isChecked = completedIds.includes(goal.id);
          return (
            <div
              key={goal.id}
              className="group flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onToggle(goal.id)}
            >
              {/* Circle checkbox */}
              <button
                className="flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: isChecked ? goal.color : 'transparent',
                  borderColor: goal.color,
                  transform: isChecked ? 'scale(0.92)' : 'scale(1)',
                }}
                onClick={(e) => { e.stopPropagation(); onToggle(goal.id); }}
              >
                {isChecked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
              </button>

              {/* Goal name */}
              <span className={`flex-1 text-sm transition-all duration-200 ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {goal.name}
              </span>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
                className="flex-shrink-0 p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { getNextGoalColor, GOAL_COLORS };
