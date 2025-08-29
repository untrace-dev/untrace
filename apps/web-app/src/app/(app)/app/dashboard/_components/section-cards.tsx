'use client';

import { api } from '@untrace/api/react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { CopyButton } from '@untrace/ui/custom/copy-button';
import { Skeleton } from '@untrace/ui/skeleton';
import { maskApiKey } from '~/lib/mask-api-key';

export function SectionCards() {
  const apiKeys = api.apiKeys.allWithLastUsage.useQuery();

  const apiKey = apiKeys.data?.[0];
  const maskedApiKey = apiKey ? maskApiKey(apiKey.key) : '';

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card col-span-2 row-span-2">
        <CardHeader>
          <CardDescription>API Key</CardDescription>
          <CardTitle className="flex items-center gap-2 w-full">
            {apiKey && (
              <>
                <span className="font-mono text-sm select-all tabular-nums bg-muted px-2 py-1 rounded w-full">
                  {maskedApiKey}
                </span>
                <span className="ml-2">
                  <CopyButton
                    size="sm"
                    text={apiKey?.key ?? ''}
                    variant="outline"
                  />
                </span>
              </>
            )}
            {!apiKey && <Skeleton className="w-full h-4" />}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs select-all">
                env UNTRACE_API_KEY=
                {maskedApiKey} npx -y @untrace/mcp
              </span>
              <CopyButton
                size="sm"
                text={`env UNTRACE_API_KEY=${apiKey?.key} npx -y @untrace/mcp`}
                variant="outline"
              />
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              Use this command to set up MCP server integration in Cursor.
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
