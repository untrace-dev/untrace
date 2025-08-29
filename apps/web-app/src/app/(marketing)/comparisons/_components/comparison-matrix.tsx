'use client';

import { MagicCard } from '@untrace/ui/magicui/magic-card';
import { XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ComparisonRow {
  beeceptor: boolean;
  cloudflare: boolean;
  feature: string;
  hookdeck: boolean;
  localtunnel: boolean;
  ngrok: boolean;
  smee: boolean;
  svix: boolean;
  untrace: boolean;
  webhookSite: boolean;
}

interface ComparisonMatrixProps {
  comparisonMatrix: ComparisonRow[];
}

const CheckmarkIcon = () => (
  <div className="size-5 rounded-full border flex items-center justify-center mx-auto bg-secondary/50 border-border">
    <div className="size-3 flex items-center justify-center">
      <svg
        className="block dark:hidden"
        fill="none"
        height="7"
        viewBox="0 0 8 7"
        width="8"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Checkmark Icon</title>
        <path
          d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
          stroke="#101828"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
      <svg
        className="hidden dark:block"
        fill="none"
        height="7"
        viewBox="0 0 8 7"
        width="8"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Checkmark Icon</title>
        <path
          d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
          stroke="#FAFAFA"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  </div>
);

export function ComparisonMatrix({ comparisonMatrix }: ComparisonMatrixProps) {
  return (
    <motion.div
      animate="visible"
      className="group"
      initial="hidden"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }}
      whileHover={{
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
    >
      <MagicCard
        className="p-0 transition-all duration-300 group-hover:shadow-lg"
        gradientColor="var(--muted)"
        gradientFrom="var(--primary)"
        gradientOpacity={0.6}
        gradientTo="var(--secondary)"
      >
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="text-center p-4 font-medium text-secondary">
                  Untrace
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  ngrok
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Webhook.site
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Beeceptor
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Localtunnel
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Smee.io
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Cloudflare
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Hookdeck
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Svix
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonMatrix.map((row) => (
                <tr
                  className="border-b last:border-b-0 hover:bg-muted/30 border-primary/10"
                  key={row.feature}
                >
                  <td className="p-4 font-medium text-nowrap">{row.feature}</td>
                  <td className="p-4 text-center">
                    {row.untrace ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.ngrok ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.webhookSite ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.beeceptor ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.localtunnel ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.smee ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.cloudflare ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.hookdeck ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.svix ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MagicCard>
    </motion.div>
  );
}
