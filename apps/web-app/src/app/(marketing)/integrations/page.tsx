import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { IntegrationsContent } from './_components/integrations-content';

export const metadata = {
  description:
    'Explore how Untrace integrates with Langtrace, Traceloop, Laminar, Promptfoo, Langfuse, Helicone, LangSmith, Arize, and Datadog for seamless LLM trace forwarding and observability.',
  keywords: [
    'LLM trace forwarding',
    'Langtrace integration',
    'Traceloop integration',
    'Laminar integration',
    'Promptfoo integration',
    'Langfuse integration',
    'Helicone integration',
    'LangSmith integration',
    'Arize integration',
    'Datadog integration',
    'LLM observability platforms',
  ],
  title:
    'Untrace Integrations: LLM Observability Platform Connections | Untrace',
};

export default function IntegrationsPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar />
      <IntegrationsContent />
      <FooterSection />
    </div>
  );
}
