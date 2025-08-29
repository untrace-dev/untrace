'use client';

import { Badge } from '@untrace/ui/badge';
import { Button } from '@untrace/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { Icons } from '@untrace/ui/custom/icons';
import { Switch } from '@untrace/ui/switch';

const integrations = [
  {
    category: 'AI/ML',
    color: 'text-green-500',
    description:
      'Connect your OpenAI account to track API usage and performance metrics',
    icon: 'Sparkles',
    id: 'openai',
    name: 'OpenAI',
    status: 'connected',
  },
  {
    category: 'AI/ML',
    color: 'text-purple-500',
    description: 'Monitor Claude API calls and analyze response patterns',
    icon: 'FlaskConical',
    id: 'anthropic',
    name: 'Anthropic',
    status: 'disconnected',
  },
  {
    category: 'Development',
    color: 'text-gray-900 dark:text-gray-100',
    description:
      'Track repository events and integrate with your development workflow',
    icon: 'Github',
    id: 'github',
    name: 'GitHub',
    status: 'connected',
  },
  {
    category: 'Communication',
    color: 'text-pink-500',
    description: 'Send alerts and notifications to your Slack channels',
    icon: 'MessageSquareText',
    id: 'slack',
    name: 'Slack',
    status: 'disconnected',
  },
  {
    category: 'Monitoring',
    color: 'text-purple-600',
    description: 'Export traces and metrics to your Datadog dashboards',
    icon: 'BarChart2',
    id: 'datadog',
    name: 'Datadog',
    status: 'disconnected',
  },
  {
    category: 'Incident Management',
    color: 'text-red-500',
    description: 'Create incidents based on critical errors and anomalies',
    icon: 'AlertTriangle',
    id: 'pagerduty',
    name: 'PagerDuty',
    status: 'disconnected',
  },
  {
    category: 'Custom',
    color: 'text-blue-500',
    description: 'Send custom webhook notifications for any event',
    icon: 'Settings',
    id: 'webhook',
    name: 'Webhooks',
    status: 'connected',
  },
  {
    category: 'Communication',
    color: 'text-orange-500',
    description: 'Receive email notifications for important events',
    icon: 'Mail',
    id: 'email',
    name: 'Email',
    status: 'connected',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header Section */}
          <div className="px-4 lg:px-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Integrations
              </h1>
              <p className="text-muted-foreground">
                Connect your favorite tools and services to enhance your tracing
                experience
              </p>
            </div>
          </div>

          {/* Integration Cards Grid */}
          <div className="px-4 lg:px-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => {
                const IconComponent =
                  Icons[integration.icon as keyof typeof Icons];
                const isConnected = integration.status === 'connected';

                return (
                  <Card
                    className="relative overflow-hidden"
                    key={integration.id}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg bg-background p-2 ${integration.color}`}
                          >
                            <IconComponent className="size-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {integration.name}
                            </CardTitle>
                            <Badge className="mt-1 text-xs" variant="secondary">
                              {integration.category}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={isConnected}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <CardDescription>
                        {integration.description}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {isConnected ? (
                        <div className="flex w-full items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Icons.CheckCircle2 className="size-4" />
                            Connected
                          </span>
                          <Button size="sm" variant="outline">
                            Configure
                          </Button>
                        </div>
                      ) : (
                        <Button className="w-full" size="sm">
                          <Icons.Plus className="mr-2 size-4" />
                          Connect
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Add Custom Integration Section */}
          <div className="px-4 lg:px-6">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Need a custom integration?</CardTitle>
                <CardDescription>
                  We support custom integrations via our REST API and webhooks.
                  Contact us to learn more about building your own integration.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline">
                  <Icons.ExternalLink className="mr-2 size-4" />
                  View API Documentation
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
