'use client';

import { MetricButton } from '@untrace/analytics/components';
import { api } from '@untrace/api/react';
import { destinations } from '@untrace/destinations/config';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { Button } from '@untrace/ui/components/button';
import { Checkbox } from '@untrace/ui/components/checkbox';
import { Input } from '@untrace/ui/components/input';
import { Label } from '@untrace/ui/components/label';
import { Textarea } from '@untrace/ui/components/textarea';
import { Icons } from '@untrace/ui/custom/icons';
import { toast } from '@untrace/ui/sonner';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function DestinationsSetupPage() {
  const searchParams = useSearchParams();
  const orgName = searchParams.get('orgName');
  const projectName = searchParams.get('projectName');
  const redirectTo = searchParams.get('redirectTo') || undefined;

  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinationConfigs, setDestinationConfigs] = useState<
    Record<string, Record<string, unknown>>
  >({});

  const createDestination = api.destinations.create.useMutation();
  const apiUtils = api.useUtils();

  if (!orgName || !projectName) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Access</CardTitle>
            <CardDescription>
              This page requires valid organization and project parameters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please complete the onboarding process first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDestinationToggle = (destinationId: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(destinationId)
        ? prev.filter((id) => id !== destinationId)
        : [...prev, destinationId],
    );
  };

  const handleConfigChange = (
    destinationId: string,
    field: string,
    value: unknown,
  ) => {
    setDestinationConfigs((prev) => ({
      ...prev,
      [destinationId]: {
        ...prev[destinationId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Get the actual project ID by name
      const project = await apiUtils.projects.byName.fetch({
        name: projectName,
      });

      if (!project) {
        throw new Error(`Project "${projectName}" not found`);
      }

      // Create selected destinations
      const promises = selectedDestinations.map((destinationId) => {
        const destination = destinations.find((d) => d.id === destinationId);
        if (!destination) return Promise.resolve();

        const config = destinationConfigs[destinationId] || {};

        return createDestination.mutateAsync({
          config,
          destinationId: destination.id,
          isEnabled: true,
          name: destination.name,
          projectId: project.id, // Use the actual project ID
        });
      });

      await Promise.all(promises);

      toast.success('Destinations configured successfully!');

      // Redirect to success page
      window.location.href = `/app/onboarding/success?orgName=${encodeURIComponent(orgName)}&projectName=${encodeURIComponent(projectName)}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
    } catch (error) {
      console.error('Failed to create destinations:', error);
      toast.error('Failed to configure destinations', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Redirect to success page without setting up destinations
    window.location.href = `/app/onboarding/success?orgName=${encodeURIComponent(orgName)}&projectName=${encodeURIComponent(projectName)}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">
                🔗 Configure Destinations
              </CardTitle>
              <CardDescription>
                Choose where you'd like to send your traces. You can always add
                or modify destinations later.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Popular Destinations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Popular Destinations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {destinations.slice(0, 6).map((destination) => (
                    <button
                      className={`w-full text-left p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedDestinations.includes(destination.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      key={destination.id}
                      onClick={() => handleDestinationToggle(destination.id)}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedDestinations.includes(
                            destination.id,
                          )}
                          onChange={() =>
                            handleDestinationToggle(destination.id)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {destination.logo && (
                              <img
                                alt={destination.name}
                                className="w-6 h-6 rounded"
                                src={destination.logo}
                              />
                            )}
                            <Label className="font-medium cursor-pointer">
                              {destination.name}
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {destination.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration Forms */}
              {selectedDestinations.length > 0 && (
                <div className="space-y-4">
                  {selectedDestinations.map((destinationId) => {
                    const destination = destinations.find(
                      (d) => d.id === destinationId,
                    );
                    if (!destination) return null;

                    const config = destinationConfigs[destinationId] || {};
                    const schema = destination.configSchema;

                    return (
                      <div
                        className="p-4 border rounded-lg"
                        key={destinationId}
                      >
                        <h4 className="font-medium mb-4">{destination.name}</h4>
                        <div className="space-y-4">
                          {Object.entries(schema.properties || {}).map(
                            ([fieldName, fieldSchema]: [
                              string,
                              Record<string, unknown>,
                            ]) => {
                              const isRequired =
                                Array.isArray(schema.required) &&
                                schema.required.includes(fieldName);
                              const value =
                                config[fieldName] || fieldSchema.default || '';
                              const displayValue =
                                typeof value === 'object' && value !== null
                                  ? ''
                                  : String(value || '');

                              return (
                                <div
                                  className="flex flex-col gap-2"
                                  key={fieldName}
                                >
                                  <Label
                                    htmlFor={`${destinationId}-${fieldName}`}
                                  >
                                    {String(
                                      fieldSchema.description || fieldName,
                                    )}
                                    {isRequired && (
                                      <span className="text-destructive ml-1">
                                        *
                                      </span>
                                    )}
                                  </Label>
                                  {fieldSchema.type === 'string' &&
                                  fieldSchema.enum ? (
                                    <select
                                      className="w-full p-2 border rounded-md mt-1"
                                      id={`${destinationId}-${fieldName}`}
                                      onChange={(e) =>
                                        handleConfigChange(
                                          destinationId,
                                          fieldName,
                                          e.target.value,
                                        )
                                      }
                                      value={displayValue}
                                    >
                                      {Array.isArray(fieldSchema.enum) &&
                                        fieldSchema.enum.map(
                                          (option: string) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ),
                                        )}
                                    </select>
                                  ) : fieldSchema.type === 'string' ? (
                                    <Input
                                      id={`${destinationId}-${fieldName}`}
                                      onChange={(e) =>
                                        handleConfigChange(
                                          destinationId,
                                          fieldName,
                                          e.target.value,
                                        )
                                      }
                                      placeholder={String(
                                        fieldSchema.description || '',
                                      )}
                                      type="text"
                                      value={displayValue}
                                    />
                                  ) : fieldSchema.type === 'number' ? (
                                    <Input
                                      id={`${destinationId}-${fieldName}`}
                                      onChange={(e) =>
                                        handleConfigChange(
                                          destinationId,
                                          fieldName,
                                          Number(e.target.value),
                                        )
                                      }
                                      placeholder={String(
                                        fieldSchema.description || '',
                                      )}
                                      type="number"
                                      value={displayValue}
                                    />
                                  ) : fieldSchema.type === 'object' ? (
                                    <Textarea
                                      id={`${destinationId}-${fieldName}`}
                                      onChange={(e) => {
                                        try {
                                          const parsed = JSON.parse(
                                            e.target.value,
                                          );
                                          handleConfigChange(
                                            destinationId,
                                            fieldName,
                                            parsed,
                                          );
                                        } catch {
                                          handleConfigChange(
                                            destinationId,
                                            fieldName,
                                            e.target.value,
                                          );
                                        }
                                      }}
                                      placeholder="Enter JSON configuration"
                                      value={
                                        typeof value === 'string'
                                          ? value
                                          : JSON.stringify(value, null, 2)
                                      }
                                    />
                                  ) : null}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pro Tip */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Pro Tip
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You can skip this step and configure destinations later from
                  your dashboard. Destinations help you send traces to external
                  monitoring and observability platforms.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button onClick={handleSkip} variant="outline">
                Skip
              </Button>
              <MetricButton
                disabled={isSubmitting}
                metric="onboarding_destinations_configured"
                onClick={handleSubmit}
                properties={{
                  destination_count: selectedDestinations.length,
                  location: 'onboarding',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Icons.Spinner className="animate-spin mr-2" size="sm" />
                    Configuring...
                  </>
                ) : (
                  'Continue'
                )}
              </MetricButton>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
