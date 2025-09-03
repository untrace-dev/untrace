'use client';

import { MetricLink } from '@untrace/analytics/components';
import { api } from '@untrace/api/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { Button } from '@untrace/ui/components/button';
import { CopyButton } from '@untrace/ui/custom/copy-button';
import { Icons } from '@untrace/ui/custom/icons';
import { CodeTabs } from '@untrace/ui/magicui/code-tabs';
import { toast } from '@untrace/ui/sonner';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function OnboardingSuccessClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || undefined;
  const projectId = searchParams.get('projectId') || undefined;

  const [hasTraces, setHasTraces] = useState(false);

  // Get the default API key for the current organization
  const { data: defaultApiKey, isLoading: isLoadingApiKey } =
    api.apiKeys.default.useQuery(
      { projectId: projectId! },
      { enabled: !!projectId },
    );

  // Memoize the date to prevent unnecessary refetches
  const createdAfter = useMemo(() => {
    return new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
  }, []);

  // Use tRPC useQuery with automatic polling
  const { data: tracesData, isLoading: isPolling } = api.traces.list.useQuery(
    {
      createdAfter,
      limit: 1,
    },
    {
      enabled: !!defaultApiKey?.key, // Only enable when we have an API key
      refetchInterval: 5000, // Poll every 5 seconds
    },
  );

  // Use tRPC useMutation for sending test traces
  const sendTestTraceMutation = api.traces.sendTestTrace.useMutation({
    // onError: (error: Error) => {
    //   console.error('Error sending test trace:', error);
    //   toast.error('Failed to send test trace');
    // },
    onSuccess: () => {
      toast.success('Test trace sent successfully!');
      setHasTraces(true);
    },
  });

  // Update hasTraces when traces are detected
  useEffect(() => {
    if (tracesData?.traces && tracesData.traces.length > 0) {
      setHasTraces(true);
    }
  }, [tracesData]);

  const sendTestTrace = async () => {
    if (!defaultApiKey?.key) return;
    sendTestTraceMutation.mutate({ apiKey: defaultApiKey.key });
  };

  if (isLoadingApiKey) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Loading...</CardTitle>
            <CardDescription>Loading your API key...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Icons.Spinner
              className="animate-spin"
              size="lg"
              variant="primary"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!defaultApiKey?.key) {
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
          <CardFooter>
            <Button asChild>
              <a href="/app/onboarding">Go to Onboarding</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
              <CardTitle className="text-2xl">🎉 Welcome to Untrace!</CardTitle>
              <CardDescription>
                Your organization and project have been created successfully.
                Here's your API key and next steps to start tracing.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* API Key Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your API Key</h3>
                <div className="relative">
                  <input
                    className="w-full p-3 pr-12 bg-muted border rounded-md font-mono text-sm"
                    readOnly
                    type="text"
                    value={defaultApiKey?.key || ''}
                  />
                  <CopyButton
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    size="sm"
                    text={defaultApiKey?.key || ''}
                    variant="outline"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep this API key secure. You'll need it to send traces to
                  Untrace.
                </p>
              </div>

              {/* Trace Status Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trace Status</h3>
                <div className="p-2 bg-muted rounded-lg">
                  {hasTraces ? (
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                      <Icons.CheckCircle2 size="sm" variant="primary" />
                      <span className="font-medium">Traces detected!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isPolling ? (
                          <>
                            <Icons.Spinner
                              className="animate-spin"
                              size="sm"
                              variant="primary"
                            />
                            <span className="text-muted-foreground">
                              Waiting for traces...
                            </span>
                          </>
                        ) : (
                          <>
                            <Icons.Clock size="sm" variant="muted" />
                            <span className="text-muted-foreground">
                              No traces detected yet
                            </span>
                          </>
                        )}
                      </div>
                      <Button
                        disabled={sendTestTraceMutation.isPending}
                        onClick={sendTestTrace}
                        size="sm"
                        variant="outline"
                      >
                        {sendTestTraceMutation.isPending ? (
                          <>
                            <Icons.Spinner
                              className="animate-spin mr-2"
                              size="sm"
                              variant="primary"
                            />
                            Sending...
                          </>
                        ) : (
                          'Send Test Trace'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasTraces
                    ? 'Great! Your traces are being received. You can now view them in your dashboard.'
                    : "We're monitoring for traces from your application. You can send a test trace to verify everything is working."}
                </p>
              </div>

              {/* Tracing Instructions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Next Steps: Add Tracing to Your Code
                </h3>

                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">1. Install the SDK</h4>
                    <CodeTabs
                      defaultTab="npm"
                      tabs={[
                        {
                          code: 'npm install @untrace/sdk',
                          label: 'npm',
                          language: 'bash',
                        },
                        {
                          code: 'yarn add @untrace/sdk',
                          label: 'yarn',
                          language: 'bash',
                        },
                        {
                          code: 'pnpm add @untrace/sdk',
                          label: 'pnpm',
                          language: 'bash',
                        },
                        {
                          code: 'bun add @untrace/sdk',
                          label: 'bun',
                          language: 'bash',
                        },
                        {
                          code: 'pip install untrace',
                          label: 'pip',
                          language: 'bash',
                        },
                      ]}
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">
                      2. Initialize and start tracing
                    </h4>
                    <CodeTabs
                      defaultTab="TypeScript"
                      tabs={[
                        {
                          code: `import { init } from '@untrace/sdk';
import OpenAI from 'openai';

// Initialize the SDK
init({
  apiKey: '${defaultApiKey?.key || ''}',
});

// Your LLM calls are automatically traced!
const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
});`,
                          label: 'TypeScript',
                          language: 'typescript',
                        },
                        {
                          code: `from untrace import Untrace
from openai import OpenAI

# Initialize the SDK
untrace = Untrace(
    api_key="${defaultApiKey?.key || ''}",
)

# Your LLM calls are automatically traced!
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)`,
                          label: 'Python',
                          language: 'python',
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💡 Pro Tip
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    The SDK automatically instruments popular LLM libraries like
                    OpenAI, Anthropic, and LangChain. Just initialize the SDK
                    before importing your LLM libraries!
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button asChild variant="outline">
                <a
                  href="https://docs.untrace.sh"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View Documentation
                </a>
              </Button>
              <MetricLink
                asChild
                href={redirectTo ?? `/app/${projectId}/dashboard`}
                metric="onboarding_complete_setup_clicked"
                properties={{
                  destination: redirectTo ?? `/app/${projectId}/dashboard`,
                  location: 'onboarding',
                }}
              >
                <Button>Go to Dashboard</Button>
              </MetricLink>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
