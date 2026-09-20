import React from 'react';
import { Header } from '@/components/layout/header';
import { SettingsClient } from './settings-client';

export const revalidate = 0;

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Ajustes de Plataforma y Canales de Notificación"
        subtitle="Configuración unificada de Telegram, Email, WhatsApp, tokens globales y monitoreo de base de datos"
      />

      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <SettingsClient />
      </div>
    </div>
  );
}
