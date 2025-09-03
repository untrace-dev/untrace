'use client';

import {
  IconActivity,
  IconDatabase,
  IconFlask,
  IconGauge,
  IconPencil,
  IconSearch,
  IconSettings,
  IconSparkles,
} from '@tabler/icons-react';
import { MetricButton } from '@untrace/analytics/components';
import { api } from '@untrace/api/react';
import { Badge } from '@untrace/ui/badge';
import { TimezoneDisplay } from '@untrace/ui/custom/timezone-display';
import * as Editable from '@untrace/ui/diceui/editable-input';
import { Skeleton } from '@untrace/ui/skeleton';
import { Switch } from '@untrace/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@untrace/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@untrace/ui/tooltip';
import Link from 'next/link';
import { DeleteDestinationDialog } from './delete-destination-dialog';

interface DestinationsTableProps {
  projectId: string;
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-8 w-[150px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[80px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[80px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="size-8 rounded w-[100px]" />
      </TableCell>
    </TableRow>
  );
}

const getDestinationIcon = (type: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    custom: IconSettings,
    datadog: IconSearch,
    elasticsearch: IconSearch,
    grafana: IconGauge,
    keywords_ai: IconSearch,
    langfuse: IconGauge,
    langsmith: IconFlask,
    new_relic: IconActivity,
    openai: IconSparkles,
    posthog: IconSearch,
    prometheus: IconGauge,
    s3: IconDatabase,
    webhook: IconSettings,
  };
  return iconMap[type] || IconSettings;
};

const getDestinationColor = (type: string) => {
  const colorMap: Record<string, string> = {
    custom: 'text-gray-600',
    datadog: 'text-purple-600',
    elasticsearch: 'text-yellow-500',
    grafana: 'text-orange-600',
    keywords_ai: 'text-orange-500',
    langfuse: 'text-blue-500',
    langsmith: 'text-purple-500',
    new_relic: 'text-blue-600',
    openai: 'text-green-500',
    posthog: 'text-purple-500',
    prometheus: 'text-red-500',
    s3: 'text-gray-500',
    webhook: 'text-pink-500',
  };
  return colorMap[type] || 'text-gray-500';
};

export function DestinationsTable({ projectId }: DestinationsTableProps) {
  const destinations = api.destinations.list.useQuery({ projectId });
  const deliveryStats = api.destinations.deliveryStats.useQuery({
    days: 30,
    projectId,
  });
  const apiUtils = api.useUtils();
  const updateDestination = api.destinations.update.useMutation({
    onSuccess: () => {
      apiUtils.destinations.list.invalidate({ projectId });
      apiUtils.destinations.deliveryStats.invalidate({ projectId });
    },
  });

  const handleUpdateDestinationName = ({
    destinationId,
    oldName,
    newName,
  }: {
    destinationId: string;
    oldName: string;
    newName: string;
  }) => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== '' && trimmedName !== oldName) {
      updateDestination.mutate({
        data: { name: trimmedName },
        id: destinationId,
        projectId,
      });
    }
  };

  const handleToggleEnabled = (destinationId: string, enabled: boolean) => {
    updateDestination.mutate({
      data: { isEnabled: enabled },
      id: destinationId,
      projectId,
    });
  };

  return (
    <div className="rounded border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Deliveries</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {destinations.isLoading
            ? // Show skeleton rows while loading
              ['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
                <SkeletonRow key={key} />
              ))
            : // Show actual data when loaded
              destinations.data?.destinations.map((destination) => {
                const IconComponent = getDestinationIcon(
                  destination.destination.type,
                );
                const color = getDestinationColor(destination.destination.type);

                // Get delivery stats for this destination
                const destinationStats = deliveryStats.data?.stats.find(
                  (stat) => stat.destinationId === destination.id,
                );

                return (
                  <TableRow key={destination.id}>
                    <TableCell className="font-medium truncate max-w-40">
                      <Editable.Root
                        className="flex flex-row items-center gap-1.5"
                        defaultValue={destination.name}
                        onSubmit={(value) =>
                          handleUpdateDestinationName({
                            destinationId: destination.id,
                            newName: value,
                            oldName: destination.name,
                          })
                        }
                      >
                        <Editable.Area className="flex-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Editable.Preview className="w-full rounded-md px-1.5 py-1" />
                            </TooltipTrigger>
                            <TooltipContent>{destination.name}</TooltipContent>
                          </Tooltip>
                          <Editable.Input
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            className="px-1.5 py-1"
                          />
                        </Editable.Area>
                        <Editable.Trigger asChild>
                          <MetricButton
                            className="size-7"
                            metric="destinations_table_edit_name_clicked"
                            size="icon"
                            variant="ghost"
                          >
                            <IconPencil />
                          </MetricButton>
                        </Editable.Trigger>
                      </Editable.Root>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {destination.destination.logo ? (
                          // biome-ignore lint/performance/noImgElement: no need
                          <img
                            alt={`${destination.destination.name} logo`}
                            className="size-6 rounded"
                            src={destination.destination.logo}
                          />
                        ) : (
                          <div
                            className={`rounded-lg bg-background p-1 ${color}`}
                          >
                            <IconComponent className="size-4" />
                          </div>
                        )}
                        <span className="text-sm">
                          {destination.destination.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          destination.isEnabled ? 'default' : 'secondary'
                        }
                      >
                        {destination.isEnabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {deliveryStats.isLoading
                          ? '...'
                          : destinationStats?.totalDeliveries.toLocaleString() ||
                            '0'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TimezoneDisplay date={destination.createdAt} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={destination.isEnabled}
                          className="data-[state=checked]:bg-green-500"
                          onCheckedChange={(enabled) =>
                            handleToggleEnabled(destination.id, enabled)
                          }
                        />
                        <Link href={`/app/destinations/${destination.id}`}>
                          <MetricButton
                            className="size-7"
                            metric="destinations_table_view_details_clicked"
                            size="icon"
                            variant="ghost"
                          >
                            <IconPencil />
                          </MetricButton>
                        </Link>
                        <DeleteDestinationDialog
                          destinationId={destination.id}
                          destinationName={destination.name}
                          projectId={projectId}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
