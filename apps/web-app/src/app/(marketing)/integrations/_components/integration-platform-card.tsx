'use client';

import { Badge } from '@untrace/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { MagicCard } from '@untrace/ui/magicui/magic-card';
import { motion } from 'motion/react';

interface IntegrationPlatform {
  category: string;
  integration: string;
  description: string;
  logo: string;
  marketShare: string;
  name: string;
  pricing: string;
  strengths: string[];
  untraceAdvantages: string[];
  weaknesses: string[];
  website: string;
}

interface IntegrationPlatformCardProps {
  platform: IntegrationPlatform;
  index: number;
}

export function IntegrationPlatformCard({
  platform,
  index,
}: IntegrationPlatformCardProps) {
  // Extract domain from website URL for brandfetch
  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return '';
    }
  };

  const domain = getDomainFromUrl(platform.website);
  const logoUrl = domain
    ? `https://cdn.brandfetch.io/${domain}/w/400/h/400?c=1idGJK6TyS2PPBb74bA`
    : '';

  return (
    <motion.div
      animate="visible"
      className="group"
      id={platform.name.toLowerCase()}
      transition={{ delay: index * 0.1 }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: 'easeOut' },
        y: -4,
      }}
    >
      <Card className="p-0 w-full shadow-none border-none">
        <MagicCard
          className="p-0 transition-all duration-300 group-hover:shadow-lg"
          gradientColor="var(--muted)"
          gradientFrom="var(--primary)"
          gradientOpacity={0.6}
          gradientTo="var(--secondary)"
        >
          <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
            <div className="flex items-center gap-4 mb-4">
              {logoUrl ? (
                <a
                  className="block hover:opacity-80 transition-opacity"
                  href={platform.website}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {/** biome-ignore lint/performance/noImgElement: no need*/}
                  <img
                    alt={`${platform.name} logo`}
                    className="rounded-lg"
                    height={48}
                    src={logoUrl}
                    width={48}
                  />
                </a>
              ) : (
                <span className="text-4xl">{platform.logo}</span>
              )}
              <div>
                <CardTitle className="text-xl">{platform.name}</CardTitle>
                <CardDescription>{platform.category}</CardDescription>
              </div>
              <Badge className="ml-auto" variant="secondary">
                {platform.marketShare} Usage
              </Badge>
            </div>
            <p className="text-muted-foreground">{platform.description}</p>
          </CardHeader>

          <CardContent className="p-4 space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-medium">Starting Price:</span>
              <span className="text-primary font-semibold">
                {platform.pricing}
              </span>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-primary">
                Why Teams Choose Untrace Integration:
              </h4>
              <ul className="space-y-2">
                {platform.untraceAdvantages.map((advantage) => (
                  <li
                    className="flex items-center gap-2 text-sm"
                    key={advantage}
                  >
                    <div className="size-5 rounded-full border flex items-center justify-center bg-secondary/50 border-border">
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
                    {advantage}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2 text-primary">
                  Platform Strengths:
                </h5>
                <ul className="space-y-1">
                  {platform.strengths.map((strength) => (
                    <li
                      className="text-sm text-muted-foreground"
                      key={strength}
                    >
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2 text-muted-foreground">
                  Platform Limitations:
                </h5>
                <ul className="space-y-1">
                  {platform.weaknesses.map((weakness) => (
                    <li
                      className="text-sm text-muted-foreground"
                      key={weakness}
                    >
                      • {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </MagicCard>
      </Card>
    </motion.div>
  );
}
