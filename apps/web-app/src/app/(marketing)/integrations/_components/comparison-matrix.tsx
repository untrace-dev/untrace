'use client';

import { MagicCard } from '@untrace/ui/magicui/magic-card';
import { XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface IntegrationMatrixRow {
  langtrace: boolean;
  traceloop: boolean;
  laminar: boolean;
  promptfoo: boolean;
  langfuse: boolean;
  helicone: boolean;
  langsmith: boolean;
  arize: boolean;
  datadog: boolean;
  untrace: boolean;
  feature: string;
}

interface ComparisonMatrixProps {
  comparisonMatrix: IntegrationMatrixRow[];
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
                  Langtrace
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Traceloop
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Laminar
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Promptfoo
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Langfuse
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Helicone
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  LangSmith
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Arize
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Datadog
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
                    {row.langtrace ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.traceloop ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.laminar ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.promptfoo ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.langfuse ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.helicone ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.langsmith ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.arize ? (
                      <CheckmarkIcon />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.datadog ? (
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
