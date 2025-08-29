'use client';

import { useOrganization } from '@clerk/nextjs';
import { IconInfoCircle } from '@tabler/icons-react';
import { MetricButton } from '@untrace/analytics/components';
import { api } from '@untrace/api/react';
import { useIsEntitled } from '@untrace/stripe/guards/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { Icons } from '@untrace/ui/custom/icons';
import { Progress } from '@untrace/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@untrace/ui/tooltip';
import { useAction } from 'next-safe-action/hooks';
import { useMemo } from 'react';
import { createCheckoutSessionAction } from '~/app/(app)/app/settings/billing/actions';

// Types for usage data
interface UsageData {
  current: number | null;
  description: string;
  isLoading: boolean;
  isUnlimited: boolean;
  limit: number;
  period: 'day' | 'month';
  planName: string;
}

// Common tooltip component
function UsageTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconInfoCircle className="size-3 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">
            API key usage is counted when you make requests using your API keys.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Common card header component
function UsageCardHeader({
  planName,
  description,
}: {
  planName?: string;
  description?: string;
}) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">Usage</CardTitle>
          <UsageTooltip />
        </div>
        {planName && (
          <span className="text-xs text-muted-foreground">{planName}</span>
        )}
      </div>
      {description && (
        <CardDescription className="text-xs">{description}</CardDescription>
      )}
    </CardHeader>
  );
}

// Loading content component
function LoadingContent() {
  return (
    <div className="flex items-center justify-center py-4">
      <Icons.Spinner size="sm" variant="muted" />
      <span className="ml-2 text-xs text-muted-foreground">
        Loading usage...
      </span>
    </div>
  );
}

// Usage display component
function UsageDisplay({ usage }: { usage: UsageData }) {
  if (usage.isUnlimited) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">API calls this month</span>
          <span className="font-medium">{usage.current?.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  const percentage = Math.round(((usage.current ?? 0) / usage.limit) * 100);
  const isApproachingLimit = (usage.current ?? 0) >= usage.limit * 0.8;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          API calls this month ({usage.current?.toLocaleString()} /{' '}
          {usage.limit})
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <Progress className="h-1.5" value={percentage} />
      {isApproachingLimit && (
        <div className="text-xs text-warning">Approaching limit</div>
      )}
    </div>
  );
}

// Usage data hook that fetches real data from the API
function useApiKeyUsage(): UsageData {
  const { data: usageStats, isLoading } = api.apiKeyUsage.stats.useQuery({
    days: 30,
    type: 'mcp-server',
  });

  return useMemo(() => {
    if (isLoading) {
      return {
        current: 0,
        description: '',
        isLoading: true,
        isUnlimited: false,
        limit: 0,
        period: 'month',
        planName: '',
      };
    }

    // Calculate total API calls from the stats
    const totalCalls =
      usageStats?.reduce(
        (sum: number, stat: { count: number; type: string }) => {
          return sum + stat.count;
        },
        0,
      ) ?? 0;

    // Free plan: 1000 API calls per month
    return {
      current: totalCalls,
      description: '1000 API calls per month',
      isLoading: false,
      isUnlimited: false,
      limit: 1000,
      period: 'month',
      planName: 'Free Plan',
    };
  }, [usageStats, isLoading]);
}

export function UsageCard() {
  const { organization } = useOrganization();
  const isEntitled = useIsEntitled('unlimited_webhook_events');
  const usage = useApiKeyUsage();

  const { executeAsync: executeCreateCheckout, status: checkoutStatus } =
    useAction(createCheckoutSessionAction);

  const isSubscribing = checkoutStatus === 'executing';

  const handleUpgrade = async () => {
    if (!organization?.id) return;

    try {
      await executeCreateCheckout();
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  if (isEntitled) {
    return null;
  }

  return (
    <Card className="mx-2 border-border/50 bg-card/50 shadow-none">
      <UsageCardHeader
        description={usage.isLoading ? undefined : usage.description}
        planName={usage.isLoading ? undefined : usage.planName}
      />
      <CardContent>
        <div className="space-y-3">
          {usage.isLoading ? (
            <LoadingContent />
          ) : (
            <>
              <UsageDisplay usage={usage} />
              <MetricButton
                className="w-full"
                disabled={isSubscribing}
                metric="usage_card_upgrade_clicked"
                onClick={handleUpgrade}
                size="sm"
                variant="secondary"
              >
                {isSubscribing ? 'Redirecting...' : 'Upgrade For Unlimited'}
              </MetricButton>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
