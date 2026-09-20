import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata: Metadata = {
  title: 'SentinelIDPY — Panel de Administración Central',
  description: 'Plataforma de administración, monitoreo y mantenimiento para Impulsos Digitales',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="min-h-full bg-slate-950 text-slate-100 flex font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen bg-slate-950">
          {children}
        </main>
      </body>
    </html>
  );
}
