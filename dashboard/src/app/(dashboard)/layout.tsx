import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allSites = await dataService.getSites();
  const pendingUpdatesCount = allSites
    .filter((s) => s.type === 'wordpress')
    .reduce(
      (acc, s) =>
        acc +
        (s.pendingUpdates?.plugins || 0) +
        (s.pendingUpdates?.themes || 0) +
        (s.pendingUpdates?.wordpress || 0),
      0
    );
  const offlineSitesCount = allSites.filter((s) => s.status === 'offline').length;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans">
      <Sidebar pendingUpdatesCount={pendingUpdatesCount} offlineSitesCount={offlineSitesCount} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
