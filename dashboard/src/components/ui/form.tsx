import React from 'react';

export function Label({
  className = '',
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-xs font-bold text-slate-950 dark:text-slate-100 mb-1.5 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export function Checkbox({
  className = '',
  label,
  id,
  ...props
}: CheckboxProps) {
  const generatedId = id || (typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <label
      htmlFor={generatedId}
      className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-950 dark:text-slate-100 cursor-pointer select-none hover:text-sky-700 dark:hover:text-white transition-colors"
    >
      <input
        type="checkbox"
        id={generatedId}
        className={`w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-emerald-500 ${className}`}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
