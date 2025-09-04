'use client';

import { api } from '@untrace/api/react';
import { getActiveDestinations } from '@untrace/destinations/config';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { toast } from '@untrace/ui/sonner';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfigureDestinationDialog } from '../../destinations/_components/configure-destination-dialog';

export function DestinationsGrid() {
  const { projectId } = useParams();
  const router = useRouter();
  const destinations = getActiveDestinations();
  const [selectedDestination, setSelectedDestination] = useState<
    (typeof destinations)[0] | null
  >(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const apiUtils = api.useUtils();
  const createDestination = api.destinations.create.useMutation({
    onError: (error) => {
      toast.error('Failed to create destination', {
        description: error.message,
      });
    },
    onSuccess: () => {
      apiUtils.destinations.list.invalidate({ projectId: projectId as string });
      toast.success('Destination created successfully!');
      // Redirect to destinations page
      router.push(`/app/${projectId}/destinations`);
    },
  });

  const handleDestinationClick = (destination: (typeof destinations)[0]) => {
    setSelectedDestination(destination);
    setShowConfigDialog(true);
  };

  const handleConfigurationSubmit = async (config: Record<string, string>) => {
    if (!selectedDestination) {
      toast.error('No destination selected');
      return;
    }

    try {
      await createDestination.mutateAsync({
        config,
        destinationId: selectedDestination.id,
        isEnabled: true,
        name: selectedDestination.name,
        projectId: projectId as string,
      });
    } catch (error) {
      console.error('Failed to create destination:', error);
      // Error is already handled by the mutation's onError
    }
  };

  const handleConfigurationCancel = () => {
    setShowConfigDialog(false);
    setSelectedDestination(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Destinations</CardTitle>
          <CardDescription>
            Connect with your favorite observability tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {destinations.map((destination) => (
              <button
                className="group block h-full w-full text-left"
                key={destination.id}
                onClick={() => handleDestinationClick(destination)}
                type="button"
              >
                <div className="flex flex-col h-full p-3 rounded-lg border hover:bg-muted transition-colors">
                  {/* Icon and Title Row */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0">
                      {destination.logo ? (
                        // biome-ignore lint/performance/noImgElement: no need
                        <img
                          alt={`${destination.name} logo`}
                          className="h-8 w-8 object-contain rounded-md"
                          src={destination.logo}
                        />
                      ) : (
                        <span className="text-2xl">🔗</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {destination.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                    {destination.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfigureDestinationDialog
        onCancel={handleConfigurationCancel}
        onNext={handleConfigurationSubmit}
        onOpenChange={setShowConfigDialog}
        open={showConfigDialog}
        selectedService={
          selectedDestination
            ? {
                configSchema: selectedDestination.configSchema,
                description: selectedDestination.description,
                id: selectedDestination.id,
                logo: selectedDestination.logo,
                name: selectedDestination.name,
                type: selectedDestination.type,
              }
            : null
        }
      />
    </>
  );
}
