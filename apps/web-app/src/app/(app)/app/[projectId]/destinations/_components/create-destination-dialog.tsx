'use client';

import {
  IconActivity,
  IconCheck,
  IconFlask,
  IconGauge,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSparkles,
} from '@tabler/icons-react';
import { MetricButton } from '@untrace/analytics/components';
import { api } from '@untrace/api/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@untrace/ui/dialog';
import { Input } from '@untrace/ui/input';
import { toast } from '@untrace/ui/sonner';
import React, { useMemo, useState } from 'react';
import { ConfigureDestinationDialog } from './configure-destination-dialog';

interface CreateDestinationDialogProps {
  projectId: string;
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
    s3: IconSettings,
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

export function CreateDestinationDialog({
  projectId,
}: CreateDestinationDialogProps) {
  const apiUtils = api.useUtils();
  const availableDestinations = api.destinations.listProviders.useQuery();

  const createDestination = api.destinations.create.useMutation({
    onError: (error) => {
      toast.error('Failed to create destination', {
        description: error.message,
      });
    },
    onSuccess: () => {
      apiUtils.destinations.list.invalidate({ projectId });
      toast.success('Destination created successfully!');
    },
  });

  const [open, setOpen] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedDestinationId('');
    }
  };

  // Filter providers based on search query
  const filteredProviders = useMemo(() => {
    if (!availableDestinations.data?.providers) return [];

    return availableDestinations.data.providers.filter(
      (provider) =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [availableDestinations.data?.providers, searchQuery]);

  const handleCancel = () => {
    handleOpenChange(false);
  };

  const handleConfigurationSubmit = async (config: Record<string, string>) => {
    if (!selectedProvider) {
      toast.error('No destination provider selected');
      return;
    }

    try {
      await createDestination.mutateAsync({
        config,
        destinationId: selectedProvider.id,
        isEnabled: true,
        name: selectedProvider.name,
        projectId,
      });

      setShowConfigDialog(false);
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to create destination:', error);
      // Error is already handled by the mutation's onError
    }
  };

  const handleConfigurationCancel = () => {
    setShowConfigDialog(false);
    setSelectedDestinationId('');
  };

  const selectedProvider = availableDestinations.data?.providers.find(
    (p) => p.id === selectedDestinationId,
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <MetricButton metric="create_destination_dialog_trigger_clicked">
          <IconPlus />
          Add Destination
        </MetricButton>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Destination</DialogTitle>
          <DialogDescription>
            Select a third-party service to deliver traces to.
          </DialogDescription>
        </DialogHeader>

        <form autoComplete="off" className="flex flex-col h-full">
          {/* Hidden field to prevent autocomplete */}
          <input autoComplete="off" className="hidden" type="text" />
          {/* Search Bar */}
          <div className="relative mb-3">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              autoFocus
              autoSave="off"
              className="pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search options..."
              value={searchQuery}
            />
          </div>

          {/* Provider Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 mb-4">
            {availableDestinations.isLoading ? (
              <div className="grid grid-cols-4 gap-3 pb-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    className="h-24 bg-muted animate-pulse rounded-lg"
                    key={`skeleton-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: false positive
                      i
                    }`}
                  />
                ))}
              </div>
            ) : filteredProviders.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 pb-2">
                {filteredProviders.map((provider) => {
                  const isSelected = selectedDestinationId === provider.id;

                  return (
                    <button
                      className={`relative cursor-pointer rounded-lg border p-2.5 transition-all hover:border-primary text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      key={provider.id}
                      onClick={() => {
                        setSelectedDestinationId(provider.id);
                        setShowConfigDialog(true);
                      }}
                      type="button"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        {provider.logo ? (
                          // biome-ignore lint/performance/noImgElement: no need
                          <img
                            alt={`${provider.name} logo`}
                            className="size-8 rounded"
                            src={provider.logo}
                          />
                        ) : (
                          <div
                            className={`size-8 rounded-lg bg-background flex items-center justify-center ${getDestinationColor(provider.type)}`}
                          >
                            {React.createElement(
                              getDestinationIcon(provider.type),
                              {
                                className: 'size-4',
                              },
                            )}
                          </div>
                        )}
                        <div className="text-center">
                          <div className="font-medium text-xs">
                            {provider.name}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <IconCheck className="absolute top-2 right-2 size-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Not seeing what you're looking for?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  We're constantly adding new integrations. Let us know what
                  service you'd like to see supported.
                </p>
                <MetricButton
                  metric="destination_request_clicked"
                  onClick={() => {
                    // Open external link to request new destination
                    window.open(
                      'https://github.com/untrace-dev/untrace/issues/new?template=feature_request.md&title=Add+destination+support+for+[Service+Name]',
                      '_blank',
                    );
                  }}
                  variant="outline"
                >
                  <IconPlus className="size-4 mr-2" />
                  Request New Destination
                </MetricButton>
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <MetricButton
            disabled={createDestination.isPending}
            metric="create_destination_cancel_clicked"
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </MetricButton>
        </DialogFooter>
      </DialogContent>

      <ConfigureDestinationDialog
        onCancel={handleConfigurationCancel}
        onNext={handleConfigurationSubmit}
        onOpenChange={setShowConfigDialog}
        open={showConfigDialog}
        selectedService={selectedProvider || null}
      />
    </Dialog>
  );
}
