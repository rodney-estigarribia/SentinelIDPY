import React from 'react';
import { Header } from '@/components/layout/header';
import { SettingsClient } from './settings-client';

export const revalidate = 0;

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Ajustes y Canales" />

      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <SettingsClient />
      </div>
    </div>
  );
}
