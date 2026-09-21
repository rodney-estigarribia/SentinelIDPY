import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { ProjectsClient } from './projects-client';

export const revalidate = 0;

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    dataService.getProjects(),
    dataService.getClients(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Proyectos & Pipeline" />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <ProjectsClient initialProjects={projects} clients={clients} />
      </div>
    </div>
  );
}
