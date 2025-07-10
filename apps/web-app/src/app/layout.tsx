import { AnalyticsProviders } from '@acme/analytics';
import { ReactScan } from '@acme/ui/custom/react-scan';
import { ThemeProvider } from '@acme/ui/custom/theme';
import { cn } from '@acme/ui/lib/utils';
import { Toaster } from '@acme/ui/sonner';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import '@acme/ui/globals.css';

import { TRPCReactProvider } from '@acme/api/react';
import { ClerkProvider } from '@clerk/nextjs';
import { env } from '~/env.server';

export const metadata: Metadata = {
  description:
    'The Segment for LLM traces. Capture once, route everywhere - end vendor lock-in and observability tool sprawl.',
  metadataBase: new URL(
    env.VERCEL_ENV === 'production'
      ? 'https://untrace.dev'
      : 'http://localhost:3000',
  ),
  openGraph: {
    description:
      'The Segment for LLM traces. Capture once, route everywhere - end vendor lock-in and observability tool sprawl.',
    siteName: 'Untrace',
    title: 'Untrace - LLM Observability Routing Platform',
    url: 'https://untrace.dev',
  },
  title: 'Untrace - LLM Observability Routing Platform',
  twitter: {
    card: 'summary_large_image',
    creator: '@untrace',
    site: '@untrace',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: 'white', media: '(prefers-color-scheme: light)' },
    { color: 'black', media: '(prefers-color-scheme: dark)' },
  ],
};

const isDevelopment = process.env.NODE_ENV === 'development';

export default async function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-background text-foreground relative min-h-screen font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        {isDevelopment && <ReactScan />}
        <NuqsAdapter>
          <TRPCReactProvider>
            <ClerkProvider>
              <AnalyticsProviders identifyUser>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem
                >
                  {props.children}
                  <Toaster />
                </ThemeProvider>
              </AnalyticsProviders>
            </ClerkProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
