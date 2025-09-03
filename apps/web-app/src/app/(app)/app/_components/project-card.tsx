'use client';

import type { ProjectType } from '@untrace/db/schema';
import { Badge } from '@untrace/ui/badge';
import { Card, CardContent, CardHeader } from '@untrace/ui/card';
import { Icons } from '@untrace/ui/custom/icons';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: ProjectType;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/app/${project.id}/dashboard`);
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer flex flex-col"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded bg-primary/10 flex items-center justify-center">
              <Icons.Rocket size="sm" variant="primary" />
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-32">
              {project.name.toLowerCase().replace(/\s+/g, '')}.untrace.dev
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Free Plan</div>
          <div className="text-lg font-semibold">{project.name}</div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <Badge className="text-xs" variant="secondary">
              Production
            </Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground pt-2">
          Updated{' '}
          {project.updatedAt
            ? new Date(project.updatedAt).toLocaleDateString()
            : 'Unknown'}
        </div>
      </CardContent>
    </Card>
  );
}
