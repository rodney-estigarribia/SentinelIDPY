import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-200">
      {/* Top Header Placeholder */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-44 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              </div>
              <div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content Table/List Skeleton */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <div className="h-5 w-36 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-3 w-56 rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
            </div>
            <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>

          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 animate-pulse flex items-center px-4 justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700/60" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-700/60" />
                    <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700/60" />
                  <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-700/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
