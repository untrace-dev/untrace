'use client';

import { api } from '@untrace/api/react';
import { Button } from '@untrace/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { CopyButton } from '@untrace/ui/custom/copy-button';
import { ScriptCopyBtn } from '@untrace/ui/magicui/script-copy-btn';
import { Skeleton } from '@untrace/ui/skeleton';
import { Eye, EyeOff } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { maskApiKey } from '~/lib/mask-api-key';

export function ApiKeySection() {
  const { projectId } = useParams();
  const [showKey, setShowKey] = useState(false);

  const apiKeys = api.apiKeys.allWithLastUsage.useQuery({
    projectId: projectId as string,
  });

  const apiKey = apiKeys.data?.[0];
  const maskedApiKey = apiKey ? maskApiKey(apiKey.key) : '';
  const displayKey = showKey ? apiKey?.key : maskedApiKey;

  if (apiKeys.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[500px]">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>Start tracing right away</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded-md">
            {displayKey}
          </div>
          <Button
            onClick={() => setShowKey(!showKey)}
            size="icon"
            variant="outline"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <CopyButton size="sm" text={apiKey?.key ?? ''} variant="outline" />
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">1. Install the SDK:</h4>
          <ScriptCopyBtn
            className="mx-0 flex w-full items-start justify-start [&>div>div]:justify-start [&>div>div]:pl-0 [&_button]:text-sm [&_pre]:text-sm"
            codeLanguage="bash"
            // biome-ignore assist/source/useSortedKeys: python then typescript
            commandMap={{
              pip: 'pip install untrace',
              uv: 'uv add @untrace/sdk',
              npm: 'npm install @untrace/sdk',
              pnpm: 'pnpm add @untrace/sdk',
              bun: 'bun add @untrace/sdk',
              yarn: 'yarn add @untrace/sdk',
            }}
            darkTheme="github-dark"
            lightTheme="github-light"
          />
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            2. Initialize and start tracing:
          </h4>
          <ScriptCopyBtn
            className="mx-0 flex w-full items-start justify-start [&>div>div]:justify-start [&>div>div]:pl-0 [&_button]:text-sm [&_pre]:text-sm"
            commandMap={{
              Python: `from untrace import Untrace

# Initialize the SDK
Untrace(
  api_key="${displayKey || ''}",
)`,
              TypeScript: `import { init } from '@untrace/sdk';

// Initialize the SDK
init({
  apiKey: '${displayKey || ''}',
});`,
            }}
            copyTextMap={{
              Python: `from untrace import Untrace

# Initialize the SDK
Untrace(
  api_key="${apiKey?.key || ''}",
)`,
              TypeScript: `import { init } from '@untrace/sdk';

// Initialize the SDK
init({
  apiKey: '${apiKey?.key || ''}',
});`,
            }}
            darkTheme="github-dark"
            languageMap={{
              Python: 'python',
              TypeScript: 'typescript',
            }}
            lightTheme="github-light"
          />
        </div>
      </CardContent>
    </Card>
  );
}
