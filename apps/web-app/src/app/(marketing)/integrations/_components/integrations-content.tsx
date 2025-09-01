'use client';

import { motion } from 'motion/react';
import {
  integrationMatrix,
  integrationPlatforms,
} from '../_data/integration-platforms';
import { ComparisonMatrix } from './comparison-matrix';
import { CTASection } from './cta-section';
import { HeroSection } from './hero-section';
import { IntegrationPlatformCard } from './integration-platform-card';
import { SectionHeader } from './section-header';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function IntegrationsContent() {
  return (
    <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
      <HeroSection />

      {/* Integration Platform Cards */}
      <section className="w-full py-12">
        <div className="container mx-auto px-6">
          {/* <SectionHeader
            description="In-depth analysis of how Untrace integrates with each major LLM observability platform."
            title="Detailed Integration Platform Integrations"
          /> */}

          <motion.div
            animate="visible"
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            variants={staggerContainer}
          >
            {integrationPlatforms.map((platform, index) => (
              <IntegrationPlatformCard
                index={index}
                key={platform.name}
                platform={platform}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Integration Matrix */}
      <section className="w-full py-20">
        <div className="container mx-auto px-6">
          <SectionHeader
            description="Quick overview of key features across all LLM observability platforms."
            title="Feature Comparison Matrix"
          />

          <ComparisonMatrix comparisonMatrix={integrationMatrix} />
        </div>
      </section>

      <CTASection />
    </main>
  );
}
