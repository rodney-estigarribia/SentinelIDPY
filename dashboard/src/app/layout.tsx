import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
