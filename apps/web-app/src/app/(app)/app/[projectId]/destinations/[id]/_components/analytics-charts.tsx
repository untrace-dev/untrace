'use client';

import { api } from '@untrace/api/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@untrace/ui/chart';
import { Skeleton } from '@untrace/ui/skeleton';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Bar, BarChart } from 'recharts';

// Chart configurations
const traceVolumeConfig = {
  traces: {
    color: 'hsl(var(--chart-1))',
    label: 'Traces',
  },
};

const deliverySuccessConfig = {
  failed: {
    color: 'hsl(var(--chart-2))',
    label: 'Failed',
  },
  success: {
    color: 'hsl(var(--chart-1))',
    label: 'Successful',
  },
};

const latencyConfig = {
  value: {
    color: 'hsl(var(--chart-1))',
    label: 'Latency (ms)',
  },
};

const destinationPerformanceConfig = {
  failed: {
    color: 'hsl(var(--chart-2))',
    label: 'Failed',
  },
  successful: {
    color: 'hsl(var(--chart-1))',
    label: 'Successful',
  },
};

export function AnalyticsCharts() {
  const { projectId } = useParams();

  // Fetch analytics data for the last 7 days
  const analyticsData = api.traces.analytics.useQuery({
    days: 7,
    projectId: projectId as string,
  });

  // Fetch delivery stats for the last 30 days
  const deliveryStats = api.destinations.deliveryStats.useQuery({
    days: 30,
    projectId: projectId as string,
  });

  // Process traces data for volume chart
  const traceVolumeData = useMemo(() => {
    if (!analyticsData.data?.dailyTraces) return [];

    return analyticsData.data.dailyTraces.map((item) => ({
      date: item.date,
      traces: item.count,
    }));
  }, [analyticsData.data?.dailyTraces]);

  // Process latency data for chart
  const latencyData = useMemo(() => {
    if (!analyticsData.data?.latencyStats) return [];

    const { average, p50, p95, p99 } = analyticsData.data.latencyStats;

    return [
      { metric: 'Average', value: average },
      { metric: 'P50', value: p50 },
      { metric: 'P95', value: p95 },
      { metric: 'P99', value: p99 },
    ];
  }, [analyticsData.data?.latencyStats]);

  // Process delivery stats for destination performance
  const destinationData = useMemo(() => {
    if (!deliveryStats.data?.stats) return [];

    return deliveryStats.data.stats.map((stat) => ({
      destination: `Destination ${stat.destinationId.slice(-4)}`,
      failed: stat.failedDeliveries,
      successful: stat.successfulDeliveries,
    }));
  }, [deliveryStats.data?.stats]);

  // Calculate success rate data
  const successRateData = useMemo(() => {
    if (!deliveryStats.data?.stats) return [];

    return deliveryStats.data.stats.map((stat) => ({
      destination: `Destination ${stat.destinationId.slice(-4)}`,
      success: stat.successRate,
    }));
  }, [deliveryStats.data?.stats]);

  if (analyticsData.isLoading || deliveryStats.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          'trace-volume',
          'delivery-success',
          'latency-dist',
          'destination-perf',
        ].map((chartType) => (
          <Card key={chartType}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Trace Volume Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Trace Volume</CardTitle>
          <CardDescription>
            Number of traces received over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={traceVolumeConfig}>
            <BarChart data={traceVolumeData}>
              <ChartTooltip
                content={({
                  active,
                  payload,
                  label,
                  coordinate,
                  accessibilityLayer,
                }) => (
                  <ChartTooltipContent
                    accessibilityLayer={accessibilityLayer}
                    active={active}
                    coordinate={coordinate}
                    label={label}
                    labelKey="date"
                    payload={payload}
                  />
                )}
              />
              <Bar dataKey="traces" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Delivery Success Rate Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Delivery Success Rate</CardTitle>
          <CardDescription>
            Success rate by destination over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={deliverySuccessConfig}>
            <BarChart data={successRateData}>
              <ChartTooltip
                content={({
                  active,
                  payload,
                  label,
                  coordinate,
                  accessibilityLayer,
                }) => (
                  <ChartTooltipContent
                    accessibilityLayer={accessibilityLayer}
                    active={active}
                    coordinate={coordinate}
                    formatter={(value) => [`${value}%`, 'Success Rate']}
                    label={label}
                    labelKey="destination"
                    payload={payload}
                  />
                )}
              />
              <Bar dataKey="success" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Latency Statistics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Latency Statistics</CardTitle>
          <CardDescription>
            Average, P50, P95, and P99 latency metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={latencyConfig}>
            <BarChart data={latencyData}>
              <ChartTooltip
                content={({
                  active,
                  payload,
                  label,
                  coordinate,
                  accessibilityLayer,
                }) => (
                  <ChartTooltipContent
                    accessibilityLayer={accessibilityLayer}
                    active={active}
                    coordinate={coordinate}
                    formatter={(value) => [`${value}ms`, 'Latency']}
                    label={label}
                    labelKey="metric"
                    payload={payload}
                  />
                )}
              />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Destination Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Destination Performance</CardTitle>
          <CardDescription>
            Successful vs failed deliveries by destination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={destinationPerformanceConfig}>
            <BarChart data={destinationData}>
              <ChartTooltip
                content={({
                  active,
                  payload,
                  label,
                  coordinate,
                  accessibilityLayer,
                }) => (
                  <ChartTooltipContent
                    accessibilityLayer={accessibilityLayer}
                    active={active}
                    coordinate={coordinate}
                    label={label}
                    labelKey="destination"
                    payload={payload}
                  />
                )}
              />
              <Bar dataKey="successful" fill="hsl(var(--chart-1))" />
              <Bar dataKey="failed" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
