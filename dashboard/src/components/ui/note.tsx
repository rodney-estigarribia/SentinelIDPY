import React from 'react';

export type NoteVariant = 'warning' | 'info' | 'danger' | 'success' | 'neutral';

interface NoteProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: NoteVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const noteVariantStyles: Record<NoteVariant, string> = {
  warning:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800/80',
  info:
    'bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-800/80',
  danger:
    'bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200 border-red-200 dark:border-red-800/80',
  success:
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/80',
  neutral:
    'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800',
};

export function Note({
  variant = 'warning',
  icon,
  className = '',
  children,
  ...props
}: NoteProps) {
  return (
    <div
      className={`text-[11px] p-2 rounded-lg border leading-tight font-medium ${noteVariantStyles[variant]} ${className}`}
      {...props}
    >
      {icon ? (
        <div className="flex items-start gap-1.5">
          <span className="shrink-0 mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
