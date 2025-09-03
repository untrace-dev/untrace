'use client';

import { IconTrash } from '@tabler/icons-react';
import { MetricButton } from '@untrace/analytics/components';
import { api } from '@untrace/api/react';
import { Icons } from '@untrace/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@untrace/ui/dialog';
import { useState } from 'react';

interface DeleteDestinationDialogProps {
  destinationId: string;
  destinationName: string;
  projectId: string;
}

export function DeleteDestinationDialog({
  destinationId,
  destinationName,
  projectId,
}: DeleteDestinationDialogProps) {
  const apiUtils = api.useUtils();
  const deleteDestination = api.destinations.delete.useMutation({
    onSuccess: () => {
      apiUtils.destinations.list.invalidate({ projectId });
    },
  });

  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteDestination.mutateAsync({ id: destinationId, projectId });
      setOpen(false);
    } catch (error) {
      console.error('Failed to delete destination:', error);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <MetricButton
          className="size-7"
          metric="destinations_table_delete_clicked"
          size="icon"
          variant="ghost"
        >
          <IconTrash />
        </MetricButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete destination</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{destinationName}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <MetricButton
            disabled={deleteDestination.isPending}
            metric="delete_destination_cancel_clicked"
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </MetricButton>
          <MetricButton
            disabled={deleteDestination.isPending}
            metric="delete_destination_confirm_clicked"
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteDestination.isPending ? (
              <>
                <Icons.Spinner className="animate-spin" size="sm" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </MetricButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
