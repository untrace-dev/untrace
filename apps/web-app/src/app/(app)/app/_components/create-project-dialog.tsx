'use client';

import { useQueryClient } from '@tanstack/react-query';
import { api } from '@untrace/api/react';
import { Button } from '@untrace/ui/button';
import { Card, CardContent } from '@untrace/ui/card';
import { Icons } from '@untrace/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@untrace/ui/dialog';
import { Input } from '@untrace/ui/input';
import { Label } from '@untrace/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateProjectDialogProps {
  onProjectCreated: (projectId: string) => void;
}

export function CreateProjectDialog({
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const createProject = api.projects.create.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to create project');
    },
    onSuccess: (project) => {
      if (project) {
        toast.success(`Project "${project.name}" created successfully`);
        queryClient.invalidateQueries({ queryKey: ['projects', 'all'] });
        setOpen(false);
        setName('');
        setDescription('');
        onProjectCreated(project.id);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }
    createProject.mutate({
      description: description.trim() || undefined,
      name: name.trim(),
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Card className="border-dashed border-2 border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors cursor-pointer flex flex-col">
          <CardContent className="flex flex-col items-center justify-center flex-1 gap-3">
            <Icons.Plus size="lg" variant="muted" />
            <div className="text-lg text-muted-foreground">Create project</div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your traces and destinations.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              disabled={createProject.isPending}
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              disabled={createProject.isPending}
              id="description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              value={description}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              disabled={createProject.isPending}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={createProject.isPending} type="submit">
              {createProject.isPending ? (
                <>
                  <Icons.Spinner className="mr-2" size="sm" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
