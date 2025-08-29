'use client';

import { MetricLink } from '@untrace/analytics/components';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { Button } from '@untrace/ui/components/button';
import { cn } from '@untrace/ui/lib/utils';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { env } from '~/env';

export default function OnboardingSuccessPage() {
  const searchParams = useSearchParams();
  const orgName = searchParams.get('orgName');
  const webhookName = searchParams.get('webhookName');
  const redirectTo = searchParams.get('redirectTo') || undefined;
  const source = searchParams.get('source') || undefined;
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (!orgName || !webhookName) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Access</CardTitle>
            <CardDescription>
              This page requires valid organization and webhook parameters.
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

  const webhookUrl = `${env.NEXT_PUBLIC_WEBHOOK_BASE_URL || env.NEXT_PUBLIC_API_URL || 'https://untrace.sh'}/${orgName}/${webhookName}`;

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl">
                  🎉 Your webhook is ready!
                </CardTitle>
                <CardDescription>
                  Test your webhook and start receiving events from your
                  services.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* <WebhookUrlStep webhookUrl={webhookUrl} /> */}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  asChild
                  className={cn(
                    !isSetupComplete &&
                      webhookUrl &&
                      'opacity-50 pointer-events-none w-40',
                  )}
                  disabled={!isSetupComplete && !!webhookUrl}
                  variant="secondary"
                >
                  <MetricLink
                    href={redirectTo ?? '/app/dashboard'}
                    metric="onboarding_complete_setup_clicked"
                    properties={{
                      destination: redirectTo ?? '/app/dashboard',
                      location: 'onboarding',
                    }}
                  >
                    {!webhookUrl
                      ? 'Go to Dashboard'
                      : isSetupComplete
                        ? 'Complete Setup'
                        : 'Waiting for events...'}
                  </MetricLink>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
