import { cn } from '@untrace/ui/lib/utils';
import { Globe } from '@untrace/ui/magicui/globe';
import { FirstBentoAnimation } from '~/app/(marketing)/_components/first-bento-animation';
import { FourthBentoAnimation } from '~/app/(marketing)/_components/fourth-bento-animation';
import { SecondBentoAnimation } from '~/app/(marketing)/_components/second-bento-animation';
import { SecurityShieldBackground } from '~/app/(marketing)/_components/security-shield-background';
import { ThirdBentoAnimation } from '~/app/(marketing)/_components/third-bento-animation';

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'p-1 py-0.5 font-medium dark:font-semibold text-secondary',
        className,
      )}
    >
      {children}
    </span>
  );
};

export const BLUR_FADE_DELAY = 0.15;

// Team pricing constants
export const TEAM_PRICING = {
  BASE_PRICE_MONTHLY: 10,
  BASE_PRICE_YEARLY: 8,
  DEFAULT_SEATS: 1,
  INCLUDED_SEATS: 1,
  MAX_SEATS: 50,
  PRICE_PER_SEAT_MONTHLY: 10,
  PRICE_PER_SEAT_YEARLY: 8,
} as const;

const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const siteConfig = {
  benefits: [
    {
      id: 1,
      image: '/Device-6.png',
      text: 'Reduce integration time by 80% with a single SDK instead of multiple platform-specific integrations.',
    },
    {
      id: 2,
      image: '/Device-7.png',
      text: 'Cut observability costs by 60% through intelligent sampling and routing to cost-effective platforms.',
    },
    {
      id: 3,
      image: '/Device-8.png',
      text: 'Eliminate vendor lock-in and switch between platforms without code changes.',
    },
    {
      id: 4,
      image: '/Device-1.png',
      text: 'Ensure 99.95% trace delivery with automatic failover and retry mechanisms.',
    },
  ],
  bentoSection: {
    description:
      'Capture traces once, route them intelligently to multiple observability platforms based on your rules.',
    items: [
      {
        content: <FirstBentoAnimation />,
        description:
          'Capture LLM traces through OpenAI-compatible proxy, native SDKs, or webhooks. Support for streaming and non-blocking capture.',
        id: 1,
        title: 'Universal Trace Capture',
      },
      {
        content: <SecondBentoAnimation />,
        description:
          'Pre-built integrations for LangSmith, Langfuse, Keywords.ai, Helicone, and more. Custom webhook support for any platform.',
        id: 2,
        title: '10+ Platform Integrations',
      },
      {
        content: <ThirdBentoAnimation />,
        description:
          'Route traces based on model type, cost thresholds, errors, or custom metadata. Sample intelligently to reduce costs.',
        id: 3,
        title: 'Smart Routing Rules',
      },
      {
        content: <FourthBentoAnimation once={false} />,
        description:
          'Monitor trace flow, destination health, and costs in real-time. Debug failed deliveries and test new routes.',
        id: 4,
        title: 'Real-time Monitoring',
      },
    ],
    title: 'Intelligent LLM Trace Routing',
  },
  companyShowcase: {
    companyLogos: [
      {
        id: 1,
        logo: (
          <svg
            aria-label="OpenAI Logo"
            className="dark:fill-white fill-black h-6 w-auto"
            height="24"
            role="img"
            viewBox="0 0 120 24"
            width="120"
          >
            <title>Works with OpenAI</title>
            <text
              fontFamily="system-ui"
              fontSize="16"
              fontWeight="600"
              x="0"
              y="18"
            >
              OpenAI
            </text>
          </svg>
        ),
        name: 'OpenAI',
      },
      {
        id: 2,
        logo: (
          <svg
            aria-label="LangSmith Logo"
            className="dark:fill-white fill-black h-6 w-auto"
            height="24"
            role="img"
            viewBox="0 0 120 24"
            width="120"
          >
            <title>Routes to LangSmith</title>
            <text
              fontFamily="system-ui"
              fontSize="16"
              fontWeight="600"
              x="0"
              y="18"
            >
              LangSmith
            </text>
          </svg>
        ),
        name: 'LangSmith',
      },
      {
        id: 3,
        logo: (
          <svg
            aria-label="Langfuse Logo"
            className="dark:fill-white fill-black h-6 w-auto"
            height="24"
            role="img"
            viewBox="0 0 120 24"
            width="120"
          >
            <title>Routes to Langfuse</title>
            <text
              fontFamily="system-ui"
              fontSize="16"
              fontWeight="600"
              x="0"
              y="18"
            >
              Langfuse
            </text>
          </svg>
        ),
        name: 'Langfuse',
      },
    ],
  },
  cta: 'Get Started',
  ctaSection: {
    backgroundImage: '/agent-cta-background.png',
    button: {
      href: '/app/?utm_source=marketing-site&utm_medium=cta-button',
      text: 'Start Your Free Trial',
    },
    id: 'cta',
    subtext: 'Join teams saving 80% on integration time',
    title: 'End Observability Tool Sprawl',
  },
  description:
    'The Segment for LLM traces. Capture once, route everywhere - end vendor lock-in and observability tool sprawl.',
  faqSection: {
    description:
      "Everything you need to know about Untrace. Can't find what you're looking for? Contact our support team.",
    faQitems: [
      {
        answer:
          'Untrace is a middleware platform that captures LLM traces from your AI applications and intelligently routes them to multiple observability platforms like LangSmith, Langfuse, Keywords.ai, and others. Think of it as "Segment for LLM traces" - you integrate once with us, and we handle the complexity of sending your data to any observability platform.',
        id: 1,
        question: 'What is Untrace?',
      },
      {
        answer:
          'Untrace provides three ways to capture traces: 1) OpenAI-compatible proxy (just change your base URL), 2) Native SDKs that drop in to replace OpenAI SDKs, and 3) Webhook API for custom integrations. Once captured, our routing engine evaluates your rules and sends traces to the appropriate destinations in their required formats.',
        id: 2,
        question: 'How does Untrace work?',
      },
      {
        answer:
          'Untrace adds less than 50ms latency (P95) to your LLM calls. Our infrastructure uses global edge locations, asynchronous trace processing, and automatic failover to ensure minimal impact on your application performance while guaranteeing 99.95% uptime.',
        id: 3,
        question: 'What is the performance impact?',
      },
      {
        answer:
          'We currently support 10+ destinations including LangSmith, Langfuse (cloud & self-hosted), Keywords.ai, Helicone, Phoenix/Arize, Datadog APM, custom webhooks, and data lakes (S3/GCS). We add new integrations monthly based on customer demand.',
        id: 4,
        question: 'Which platforms do you support?',
      },
      {
        answer:
          'We offer usage-based pricing with a generous free tier (100K traces/month). Paid plans start at $99/month for 10M traces. Unlike maintaining multiple direct integrations, Untrace is typically 80% cheaper while providing more flexibility and features.',
        id: 5,
        question: 'How does pricing work?',
      },
      {
        answer:
          'Security is our top priority. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We provide automatic PII detection and redaction, are SOC2 Type II compliant, and only store data temporarily for routing (with configurable retention). You maintain full control over where your data goes.',
        id: 6,
        question: 'Is my data secure?',
      },
      {
        answer:
          'Yes! Untrace provides powerful filtering and sampling capabilities. You can route by model type, cost, error conditions, or custom metadata. Use percentage-based sampling, cost thresholds, or error-biased sampling to optimize costs while maintaining visibility into critical traces.',
        id: 7,
        question: 'Can I filter or sample traces?',
      },
      {
        answer:
          'We plan to offer self-hosted options for enterprise customers in Q3 2025. This will allow you to run Untrace in your own infrastructure while maintaining all the benefits of our routing platform. Contact us to join the early access program.',
        id: 8,
        question: 'Do you support self-hosted deployment?',
      },
    ],
    title: 'Frequently Asked Questions',
  },
  featureSection: {
    description:
      'Discover how Untrace transforms webhook testing in four easy steps',
    items: [
      {
        content:
          'Create shareable webhook URLs that route to your local environment. Perfect for team collaboration.',
        id: 1,
        image:
          'https://images.unsplash.com/photo-1720371300677-ba4838fa0678?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'Generate Webhook URLs',
      },
      {
        content:
          "Webhooks are securely routed to the appropriate developer's machine based on active sessions.",
        id: 2,
        image:
          'https://images.unsplash.com/photo-1686170287433-c95faf6d3608?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzfHx8ZW58MHx8fHx8fA%3D%3D',
        title: 'Route to Local Environment',
      },
      {
        content:
          'Real-time monitoring through our web dashboard for webhook inspection and debugging.',
        id: 3,
        image:
          'https://images.unsplash.com/photo-1720378042271-60aff1e1c538?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMHx8fGVufDB8fHx8fA%3D%3D',
        title: 'Monitor & Debug',
      },
      {
        content:
          'Share webhook URLs across your team while maintaining individual developer environments.',
        id: 4,
        image:
          'https://images.unsplash.com/photo-1666882990322-e7f3b8df4f75?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D',
        title: 'Share & Collaborate',
      },
    ],
    title: 'Simple. Secure. Collaborative.',
  },
  footerLinks: [
    {
      links: [
        { id: 1, title: 'Privacy Policy', url: '/privacy-policy' },
        { id: 2, title: 'Terms of Service', url: '/terms-of-service' },
      ],
      title: 'Company',
    },
    {
      links: [
        { id: 12, title: 'VS Code Extension', url: '/vscode' },
        { id: 13, title: 'JetBrains Plugin', url: '/jetbrains' },
        { id: 14, title: 'MCP Server', url: '/mcp' },
        { id: 15, title: 'Untrace CLI', url: '/cli' },
      ],
      title: 'Products',
    },
    {
      links: [
        {
          id: 16,
          title: 'Changelog',
          url: 'https://github.com/untrace-dev/untrace/releases',
        },
        // { id: 17, title: 'Blog', url: '/blog' },
        { id: 18, title: 'Docs', url: 'https://docs.untrace.dev' },
      ],
      title: 'Resources',
    },
    // {
    //   title: 'Products',
    //   links: [
    //     { id: 5, title: 'Company', url: '#' },
    //     { id: 6, title: 'Product', url: '#' },
    //     { id: 7, title: 'Press', url: '#' },
    //     { id: 8, title: 'More', url: '#' },
    //   ],
    // },
    // {
    //   title: 'Resources',
    //   links: [
    //     { id: 9, title: 'Press', url: '#' },
    //     { id: 10, title: 'Careers', url: '#' },
    //     { id: 11, title: 'Newsletters', url: '#' },
    //     { id: 12, title: 'More', url: '#' },
    //   ],
    // },
  ],
  growthSection: {
    description:
      'Built for scale, security, and reliability. Handle millions of traces with sub-50ms latency.',
    items: [
      {
        content: <SecurityShieldBackground />,
        description:
          'Enterprise-grade security with encryption in transit and at rest. Automatic PII detection and redaction.',
        id: 1,
        title: 'SOC2 Type II Compliant',
      },
      {
        content: (
          <div className="relative flex size-full max-w-lg items-center justify-center overflow-hidden [mask-image:linear-gradient(to_top,transparent,black_50%)] -translate-y-20">
            <Globe className="top-28" />
          </div>
        ),
        description:
          'Multi-region deployment with automatic failover. Sub-50ms P95 latency overhead globally.',
        id: 2,
        title: 'Global Edge Network',
      },
    ],
    title: 'Enterprise-Grade Infrastructure',
  },
  hero: {
    badge: 'Save 80% of integration time',
    badgeIcon: (
      <svg
        aria-label="Route Icon"
        className="dark:fill-white fill-[#364153]"
        fill="none"
        height="16"
        role="img"
        viewBox="0 0 16 16"
        width="16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Route Icon</title>
        <path d="M6 2C6 0.89543 6.89543 0 8 0C9.10457 0 10 0.89543 10 2C10 3.10457 9.10457 4 8 4C6.89543 4 6 3.10457 6 2Z" />
        <path d="M2 6C0.89543 6 0 6.89543 0 8C0 9.10457 0.89543 10 2 10C3.10457 10 4 9.10457 4 8C4 6.89543 3.10457 6 2 6Z" />
        <path d="M12 8C12 6.89543 12.8954 6 14 6C15.1046 6 16 6.89543 16 8C16 9.10457 15.1046 10 14 10C12.8954 10 12 9.10457 12 8Z" />
        <path d="M8 12C6.89543 12 6 12.8954 6 14C6 15.1046 6.89543 16 8 16C9.10457 16 10 15.1046 10 14C10 12.8954 9.10457 12 8 12Z" />
        <path
          d="M8 4V6M4 8H6M10 8H12M8 10V12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
    cta: {
      primary: {
        href: '/app?utm_source=marketing-site&utm_medium=hero-cta',
        text: 'Get Started',
      },
      secondary: {
        href: 'https://docs.untrace.dev',
        text: 'View Documentation',
      },
    },
    description:
      'Capture LLM traces once and route them to any observability platform. End vendor lock-in, reduce costs, and simplify your AI infrastructure with intelligent routing.',
    title: 'LLM Observability Without the Lock-in',
  },
  keywords: [
    'LLM Observability',
    'Trace Routing',
    'LangSmith',
    'Langfuse',
    'AI Monitoring',
    'LLM Traces',
    'Observability Platform',
    'AI Infrastructure',
  ],
  links: {
    discord: 'https://discord.gg/untrace',
    email: 'hello@untrace.dev',
    github: 'https://github.com/untrace-io',
    twitter: 'https://twitter.com/untrace',
  },
  name: 'Untrace',
  nav: {
    links: [
      { href: '#hero', id: 1, name: 'Home' },
      { href: '#bento', id: 2, name: 'How it Works' },
      { href: '#integrations', id: 3, name: 'Integrations' },
      { href: '#pricing', id: 4, name: 'Pricing' },
    ],
  },
  pricing: {
    description:
      'Start free and scale as you grow. No hidden fees, just pay for what you use.',
    pricingItems: [
      {
        buttonColor: 'bg-accent text-primary',
        buttonText: 'Start Free',
        description: 'Perfect for trying out Untrace',
        features: [
          '100K traces/month',
          '2 destinations',
          'Basic routing rules',
          'Community support',
          '7-day retention',
        ],
        href: '#',
        isPopular: false,
        name: 'Free',
        period: 'month',
        price: '$0',
        yearlyPrice: '$0',
      },
      {
        betaFree: false,
        buttonColor: 'bg-secondary text-white',
        buttonText: 'Start Trial',
        description: 'For growing AI teams',
        features: [
          '10M traces/month',
          '5 destinations',
          'Advanced routing rules',
          'Cost-based sampling',
          'Email support',
          'PII detection',
          '30-day retention',
          'Usage analytics',
        ],
        href: '#',
        isPopular: true,
        name: 'Growth',
        period: 'month',
        price: '$99',
        yearlyPrice: '$990',
      },
      {
        buttonColor: 'bg-primary text-primary-foreground',
        buttonText: 'Contact Sales',
        description: 'For teams at scale',
        features: [
          '100M traces/month',
          'Unlimited destinations',
          'Custom transformations',
          'Priority support',
          '90-day retention',
          'SSO/SAML',
          'API access',
          'SLA guarantee',
        ],
        href: '#',
        isPopular: false,
        name: 'Scale',
        period: 'month',
        price: '$499',
        yearlyPrice: '$4,990',
      },
    ],
    title: 'Simple, usage-based pricing',
  },
  quoteSection: {
    author: {
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Dana Chen',
      role: 'Engineering Manager, Untrace Corp',
    },
    quote:
      'Untrace saved us from observability hell. We went from maintaining 4 different integrations to just one, and our monitoring costs dropped by 60%.',
  },
  testimonials: [
    {
      description: (
        <p>
          Untrace solved our multi-vendor nightmare. We were maintaining
          separate integrations for LangSmith and Langfuse.
          <Highlight>
            Now we route traces intelligently based on cost and criticality.
          </Highlight>{' '}
          A must-have for any AI team.
        </p>
      ),
      id: '1',
      img: 'https://randomuser.me/api/portraits/men/91.jpg',
      name: 'Alex Rivera',
      role: 'CTO at FinanceAI',
    },
    {
      description: (
        <p>
          The cost savings are incredible. We&apos;re sampling non-critical
          traces and only sending errors to expensive platforms.
          <Highlight>Our observability costs dropped by 70%!</Highlight> Untrace
          paid for itself in the first week.
        </p>
      ),
      id: '2',
      img: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Samantha Lee',
      role: 'Engineering Lead at ChatBot Inc',
    },
    {
      description: (
        <p>
          As a startup, we need flexibility. Untrace lets us experiment with
          different observability platforms without rewriting code.
          <Highlight>
            We switched from LangSmith to Langfuse in minutes.
          </Highlight>{' '}
          Essential for fast-moving teams.
        </p>
      ),
      id: '3',
      img: 'https://randomuser.me/api/portraits/men/45.jpg',
      name: 'Raj Patel',
      role: 'Founder & CEO at AI Startup',
    },
    {
      description: (
        <p>
          The reliability is outstanding. With automatic failover, we never lose
          traces even when destinations are down.
          <Highlight>99.99% delivery rate has been game-changing.</Highlight>{' '}
          Our AI ops team loves Untrace.
        </p>
      ),
      id: '4',
      img: 'https://randomuser.me/api/portraits/women/83.jpg',
      name: 'Emily Chen',
      role: 'Platform Engineer at ScaleAI',
    },
    {
      description: (
        <p>
          Being able to route different model traces to different platforms is
          brilliant.
          <Highlight>
            GPT-4 traces go to LangSmith, Claude to Langfuse, all from one SDK.
          </Highlight>{' '}
          Simplified our entire stack.
        </p>
      ),
      id: '5',
      img: 'https://randomuser.me/api/portraits/men/1.jpg',
      name: 'Michael Brown',
      role: 'Data Scientist at LLM Labs',
    },
    {
      description: (
        <p>
          The PII detection and redaction gives us peace of mind. We can route
          sanitized traces to cloud platforms while keeping raw data on-premise.
          <Highlight>
            Compliance and observability finally work together.
          </Highlight>{' '}
        </p>
      ),
      id: '6',
      img: 'https://randomuser.me/api/portraits/women/5.jpg',
      name: 'Linda Wu',
      role: 'VP of Engineering at Enterprise Co',
    },
    {
      description: (
        <p>
          Integration was ridiculously easy. We replaced 4 different SDKs with
          Untrace in an afternoon.
          <Highlight>
            The OpenAI proxy mode meant zero code changes for most of our apps.
          </Highlight>{' '}
          Incredible developer experience.
        </p>
      ),
      id: '7',
      img: 'https://randomuser.me/api/portraits/men/14.jpg',
      name: 'Carlos Gomez',
      role: 'Head of AI at HealthTech',
    },
    {
      description: (
        <p>
          The ability to transform data between platforms is powerful. We
          normalize all our traces before routing.
          <Highlight>
            One consistent format across all our observability tools.
          </Highlight>{' '}
          Untrace is our AI data backbone.
        </p>
      ),
      id: '8',
      img: 'https://randomuser.me/api/portraits/women/56.jpg',
      name: 'Aisha Khan',
      role: 'Chief Architect at AI Platform',
    },
    {
      description: (
        <p>
          Cost-based routing changed our approach to observability. High-value
          production traces get full treatment, dev traces are sampled.
          <Highlight>
            We maintain visibility while controlling costs at scale.
          </Highlight>{' '}
          Brilliant solution.
        </p>
      ),
      id: '9',
      img: 'https://randomuser.me/api/portraits/men/18.jpg',
      name: 'Tom Wilson',
      role: 'Director of MLOps at Tech Giant',
    },
    {
      description: (
        <p>
          Untrace lets us standardize observability across all our clients. One
          integration that works with whatever platform they prefer.
          <Highlight>
            We&apos;ve reduced integration time for new clients by 90%.
          </Highlight>{' '}
          Game-changer for consulting teams.
        </p>
      ),
      id: '10',
      img: 'https://randomuser.me/api/portraits/women/73.jpg',
      name: 'Sofia Martinez',
      role: 'CEO at AI Consulting',
    },
  ],
  url,
};

export type SiteConfig = typeof siteConfig;
