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
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@untrace/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@untrace/ui/select';
import { Skeleton } from '@untrace/ui/skeleton';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

const chartConfig = {
  deliveries: {
    color: 'var(--ring)',
    label: 'Deliveries',
  },
  traces: {
    color: 'var(--primary)',
    label: 'Traces',
  },
} satisfies ChartConfig;

export function SummaryStats() {
  const { projectId } = useParams();
  const [timeRange, setTimeRange] = React.useState('7d');

  // Fetch analytics data for the selected time range
  const analyticsData = api.traces.analytics.useQuery({
    days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90,
    projectId: projectId as string,
  });

  // Fetch delivery stats for the selected time range
  const deliveryStats = api.destinations.deliveryStats.useQuery({
    days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90,
    projectId: projectId as string,
  });

  // Process chart data combining traces and deliveries
  const chartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    // Generate the date range with proper date handling
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const dateRange = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateRange.push(date);
    }

    // Create a map of existing trace data
    const tracesMap = new Map();
    if (analyticsData.data?.dailyTraces) {
      analyticsData.data.dailyTraces.forEach((traceItem) => {
        const dateKey = traceItem.date; // API now returns ISO date strings
        tracesMap.set(dateKey, traceItem.count);
      });
    }

    // Since delivery stats are aggregated by destination, not by date,
    // we'll use traces data and estimate deliveries based on total
    const totalDeliveries =
      deliveryStats.data?.stats?.reduce(
        (sum, stat) => sum + stat.totalDeliveries,
        0,
      ) || 0;
    const totalTraces = analyticsData.data?.totalTraces || 0;

    // Generate complete dataset
    const result = dateRange.map((date) => {
      const dateKey = date.toISOString().split('T')[0];
      const traces = Math.max(0, tracesMap.get(dateKey) || 0);
      const deliveryRatio = totalTraces > 0 ? totalDeliveries / totalTraces : 0;
      const estimatedDeliveries = Math.max(
        0,
        Math.round(traces * deliveryRatio),
      );

      return {
        date: date.getTime(), // Use timestamp for linear scale
        dateKey: dateKey, // Keep original string for reference
        deliveries: estimatedDeliveries,
        traces: traces,
      };
    });

    return result;
  }, [
    analyticsData.data?.dailyTraces,
    deliveryStats.data?.stats,
    analyticsData.data?.totalTraces,
    timeRange,
  ]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!analyticsData.data || !deliveryStats.data?.stats) {
      return {
        totalDeliveries: 0,
        totalTraces: 0,
      };
    }

    const totalTraces = analyticsData.data?.totalTraces || 0;
    const totalDeliveries = deliveryStats.data.stats.reduce(
      (sum, stat) => sum + stat.totalDeliveries,
      0,
    );

    return {
      totalDeliveries,
      totalTraces,
    };
  }, [analyticsData.data, deliveryStats.data?.stats]);

  if (analyticsData.isLoading || deliveryStats.isLoading) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>
            <div className="text-sm">
              <div className="font-medium">
                {stats.totalTraces.toLocaleString()} traces
              </div>
              <div className="text-muted-foreground">
                {stats.totalDeliveries.toLocaleString()} deliveries
              </div>
            </div>
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <Select onValueChange={setTimeRange} value={timeRange}>
            <SelectTrigger
              aria-label="Select a value"
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            >
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem className="rounded-lg" value="90d">
                Last 3 months
              </SelectItem>
              <SelectItem className="rounded-lg" value="30d">
                Last 30 days
              </SelectItem>
              <SelectItem className="rounded-lg" value="7d">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          className="aspect-auto h-[320px] w-full"
          config={chartConfig}
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillTraces" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-traces)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-traces)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDeliveries" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-deliveries)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-deliveries)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={32}
              tickFormatter={(tick) => {
                // Format the date for display
                const date = new Date(tick);
                return date.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                });
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    });
                  }}
                />
              }
              cursor={false}
            />
            <Area
              dataKey="deliveries"
              fill="url(#fillDeliveries)"
              fillOpacity={0.4}
              stackId="a"
              stroke="var(--color-deliveries)"
              type="natural"
            />
            <Area
              dataKey="traces"
              fill="url(#fillTraces)"
              fillOpacity={0.4}
              stackId="b"
              stroke="var(--color-traces)"
              type="natural"
            />
            {/* <ChartLegend content={<ChartLegendContent />} /> */}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
