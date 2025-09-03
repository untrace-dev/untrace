'use client';

import { api } from '@untrace/api/react';
import { Icons } from '@untrace/ui/custom/icons';
import { useRouter } from 'next/navigation';
import { CreateProjectDialog } from './_components/create-project-dialog';
import { LoadingSchema } from './_components/loading-schema';
import { ProjectCard } from './_components/project-card';

export default function AppPage() {
  const router = useRouter();
  const { data: projects, isLoading, error } = api.projects.all.useQuery();

  const handleProjectCreated = (projectId: string) => {
    router.push(`/app/${projectId}/dashboard`);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Icons.AlertCircle
            className="mx-auto mb-4"
            size="xl"
            variant="destructive"
          />
          <div className="text-lg font-semibold text-destructive">
            Failed to load projects
          </div>
          <div className="text-sm text-muted-foreground">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="text-2xl font-bold">Projects</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create Project Card */}
        <CreateProjectDialog onProjectCreated={handleProjectCreated} />

        {/* Project Cards */}
        {isLoading ? (
          <LoadingSchema />
        ) : (
          // Actual project cards
          projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {!isLoading && projects?.length === 0 && (
        <div className="text-center py-12">
          <Icons.Rocket className="mx-auto mb-4" size="xl" variant="muted" />
          <div className="text-lg font-semibold text-muted-foreground">
            No projects yet
          </div>
          <div className="text-sm text-muted-foreground">
            Create your first project to get started
          </div>
        </div>
      )}
    </div>
  );
}
