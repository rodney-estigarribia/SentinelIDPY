import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'sky'
  | 'blue'
  | 'purple'
  | 'cyan';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  neutral:
    'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  indigo:
    'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800/80',
  emerald:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  amber:
    'bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800/80',
  red:
    'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-300 border-red-200 dark:border-red-800',
  sky:
    'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  blue:
    'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  purple:
    'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  cyan:
    'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[9px] px-1.5 py-0.2',
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-xs px-2.5 py-1',
};

export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  icon,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded border shadow-xs transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
