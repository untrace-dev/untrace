'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconExternalLink,
  IconInfoCircle,
  IconLock,
  IconShield,
} from '@tabler/icons-react';
import { MetricButton } from '@untrace/analytics/components';
import { Alert, AlertDescription } from '@untrace/ui/alert';
import { Badge } from '@untrace/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@untrace/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@untrace/ui/form';
import { Input } from '@untrace/ui/input';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface ConfigureDestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedService: {
    id: string;
    name: string;
    type: string;
    configSchema: Record<string, unknown>;
    description?: string | null;
    logo?: string;
  } | null;
  onNext: (config: Record<string, string>) => void;
  onCancel: () => void;
  embedded?: boolean;
}

const getConfigFields = (configSchema: Record<string, unknown>) => {
  const properties = configSchema.properties as Record<
    string,
    Record<string, unknown>
  >;
  const required = (configSchema.required as string[]) || [];

  return Object.entries(properties).map(([key, prop]) => ({
    description: prop.description as string,
    key,
    label: (prop.description as string) || key,
    required: required.includes(key),
    type:
      prop.type === 'string' && prop.format === 'url'
        ? 'url'
        : prop.type === 'string' &&
            (key.toLowerCase().includes('key') ||
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('secret'))
          ? 'password'
          : prop.type === 'string'
            ? 'text'
            : 'text',
  }));
};

export function ConfigureDestinationDialog({
  open,
  onOpenChange,
  selectedService,
  onNext,
  onCancel,
  embedded = false,
}: ConfigureDestinationDialogProps) {
  const configFields = selectedService
    ? getConfigFields(selectedService.configSchema)
    : [];

  // Create dynamic schema based on config fields
  const createSchema = () => {
    const schemaFields: Record<string, z.ZodString> = {};

    configFields.forEach((field) => {
      schemaFields[field.key] = z.string().min(1, `${field.label} is required`);
    });

    return z.object(schemaFields);
  };

  const form = useForm<z.infer<ReturnType<typeof createSchema>>>({
    defaultValues: configFields.reduce(
      (acc, field) => {
        acc[field.key] = '';
        return acc;
      },
      {} as Record<string, string>,
    ),
    resolver: zodResolver(createSchema()),
  });

  const onSubmit = (values: z.infer<ReturnType<typeof createSchema>>) => {
    onNext(values);
    form.reset();
    if (!embedded) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  const content = (
    <DialogContent className="max-w-2xl">
      <DialogHeader className="pr-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {selectedService?.logo ? (
              // biome-ignore lint/performance/noImgElement: no need
              <img
                alt={`${selectedService.name} logo`}
                className="size-8 rounded"
                src={selectedService.logo}
              />
            ) : (
              <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">
                  {selectedService?.name?.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <DialogTitle>{selectedService?.name}</DialogTitle>
              <DialogDescription>
                Deliver traces to {selectedService?.name}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="flex items-center gap-1" variant="secondary">
              <IconShield className="size-3" />
              Secure
            </Badge>
            <MetricButton
              metric="configure_destination_docs_clicked"
              size="sm"
              variant="outline"
            >
              <IconExternalLink className="size-4" />
              Docs
            </MetricButton>
          </div>
        </div>
      </DialogHeader>

      {/* Security Alert */}
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <IconLock className="size-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <strong>Your API keys are encrypted at rest</strong> and transmitted
          securely. We never store or log sensitive credentials in plain text.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Form {...form}>
        <form
          autoComplete="off"
          className="space-y-6 py-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            {configFields.map((field) => (
              <FormField
                control={form.control}
                key={field.key}
                name={field.key}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {field.label}
                      {field.key.toLowerCase().includes('key') && (
                        <IconLock className="size-3 text-muted-foreground" />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        autoSave="off"
                        className="font-mono text-sm"
                        placeholder={field.description}
                        type={field.type === 'url' ? 'url' : 'text'}
                        {...formField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconInfoCircle className="size-4" />
              <span className="font-medium">What happens next?</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>We'll validate your credentials securely</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>
                  Your traces will be delivered to {selectedService?.name}{' '}
                  automatically
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>You can revoke access anytime from your settings</span>
              </li>
            </ul>
          </div>
        </form>
      </Form>

      <DialogFooter>
        <MetricButton
          metric="configure_destination_cancel_clicked"
          onClick={handleCancel}
          variant="outline"
        >
          Cancel
        </MetricButton>
        <MetricButton
          disabled={!form.formState.isValid}
          metric="configure_destination_submit_clicked"
          onClick={form.handleSubmit(onSubmit)}
        >
          Connect Securely
        </MetricButton>
      </DialogFooter>
    </DialogContent>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {content}
    </Dialog>
  );
}
