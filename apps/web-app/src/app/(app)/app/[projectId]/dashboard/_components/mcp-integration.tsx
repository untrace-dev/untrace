'use client';

import { api } from '@untrace/api/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { CopyButton } from '@untrace/ui/custom/copy-button';
import { Skeleton } from '@untrace/ui/skeleton';
import { useParams } from 'next/navigation';
import { maskApiKey } from '~/lib/mask-api-key';

export function McpIntegration() {
  const { projectId } = useParams();

  const apiKeys = api.apiKeys.allWithLastUsage.useQuery({
    projectId: projectId as string,
  });

  const apiKey = apiKeys.data?.[0];
  const maskedApiKey = apiKey ? maskApiKey(apiKey.key) : '';

  const mcpConfig = {
    mcpServers: {
      'untrace-mcp': {
        args: ['-y', '@untrace/mcp'],
        command: 'npx',
        env: {
          UNTRACE_API_KEY: maskedApiKey,
        },
      },
    },
  };

  const configText = JSON.stringify(mcpConfig, null, 2);

  if (apiKeys.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Integration</CardTitle>
        <CardDescription>Connect with AI tools</CardDescription>
      </CardHeader>
      <CardContent className="flex items-start gap-2">
        <pre className="flex-1 text-xs bg-muted p-3 rounded-md overflow-x-auto">
          <code>{configText}</code>
        </pre>
        <CopyButton size="sm" text={configText} variant="outline" />
      </CardContent>
    </Card>
  );
}
