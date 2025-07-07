import { cn } from '@acme/ui/lib/utils';
import { FlickeringGrid } from '@acme/ui/magicui/flickering-grid';
import { Globe } from '@acme/ui/magicui/globe';
import { motion } from 'motion/react';
import { FirstBentoAnimation } from '~/app/(marketing)/_components/first-bento-animation';
import { FourthBentoAnimation } from '~/app/(marketing)/_components/fourth-bento-animation';
import { SecondBentoAnimation } from '~/app/(marketing)/_components/second-bento-animation';
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

const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const siteConfig = {
  name: 'Untrace',
  description:
    'The Segment for LLM traces. Capture once, route everywhere - end vendor lock-in and observability tool sprawl.',
  cta: 'Get Started',
  url,
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
    email: 'hello@untrace.io',
    twitter: 'https://twitter.com/untrace',
    discord: 'https://discord.gg/untrace',
    github: 'https://github.com/untrace-io',
  },
  nav: {
    links: [
      { id: 1, name: 'Home', href: '#hero' },
      { id: 2, name: 'How it Works', href: '#bento' },
      { id: 3, name: 'Integrations', href: '#integrations' },
      { id: 4, name: 'Pricing', href: '#pricing' },
    ],
  },
  hero: {
    badgeIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dark:fill-white fill-[#364153]"
        role="img"
        aria-label="Route Icon"
      >
        <title>Route Icon</title>
        <path d="M6 2C6 0.89543 6.89543 0 8 0C9.10457 0 10 0.89543 10 2C10 3.10457 9.10457 4 8 4C6.89543 4 6 3.10457 6 2Z" />
        <path d="M2 6C0.89543 6 0 6.89543 0 8C0 9.10457 0.89543 10 2 10C3.10457 10 4 9.10457 4 8C4 6.89543 3.10457 6 2 6Z" />
        <path d="M12 8C12 6.89543 12.8954 6 14 6C15.1046 6 16 6.89543 16 8C16 9.10457 15.1046 10 14 10C12.8954 10 12 9.10457 12 8Z" />
        <path d="M8 12C6.89543 12 6 12.8954 6 14C6 15.1046 6.89543 16 8 16C9.10457 16 10 15.1046 10 14C10 12.8954 9.10457 12 8 12Z" />
        <path
          d="M8 4V6M4 8H6M10 8H12M8 10V12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    badge: 'Save 80% of integration time',
    title: 'LLM Observability Without the Lock-in',
    description:
      'Capture LLM traces once and route them to any observability platform. End vendor lock-in, reduce costs, and simplify your AI infrastructure with intelligent routing.',
    cta: {
      primary: {
        text: 'Start Free Trial',
        href: '/signup?utm_source=marketing-site&utm_medium=hero-cta',
      },
      secondary: {
        text: 'View Documentation',
        href: 'https://docs.untrace.io',
      },
    },
  },
  companyShowcase: {
    companyLogos: [
      {
        id: 1,
        name: 'OpenAI',
        logo: (
          <svg
            width="120"
            height="24"
            viewBox="0 0 120 24"
            className="dark:fill-white fill-black h-6 w-auto"
            role="img"
            aria-label="OpenAI Logo"
          >
            <title>Works with OpenAI</title>
            <text
              x="0"
              y="18"
              fontFamily="system-ui"
              fontSize="16"
              fontWeight="600"
            >
              OpenAI
            </text>
          </svg>
        ),
      },
      {
        id: 2,
        name: 'LangSmith',
        logo: (
          <svg
            width="120"
            height="24"
            viewBox="0 0 120 24"
            className="dark:fill-white fill-black h-6 w-auto"
            role="img"
            aria-label="LangSmith Logo"
          >
            <title>Routes to LangSmith</title>
            <text
              x="0"
              y="18"
              fontFamily="system-ui"
              fontSize="16"
              fontWeight="600"
            >
              LangSmith
            </text>
          </svg>
        ),
      },
      {
        id: 3,
        name: 'Langfuse',
        logo: (
          <svg
            width="120"
            height="24"
            viewBox="0 0 120 24"
            className="dark:fill-white fill-black h-6 w-auto"
            role="img"
            aria-label="Langfuse Logo"
          >
            <title>Routes to Langfuse</title>
            <text
              x="0"
              y="18"
              fontFamily="system-ui"
              fontSize="16"
              fontWeight="600"
            >
              Langfuse
            </text>
          </svg>
        ),
      },
    ],
  },
  featureSection: {
    title: 'Simple. Secure. Collaborative.',
    description:
      'Discover how Acme transforms webhook testing in four easy steps',
    items: [
      {
        id: 1,
        title: 'Generate Webhook URLs',
        content:
          'Create shareable webhook URLs that route to your local environment. Perfect for team collaboration.',
        image:
          'https://images.unsplash.com/photo-1720371300677-ba4838fa0678?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        id: 2,
        title: 'Route to Local Environment',
        content:
          "Webhooks are securely routed to the appropriate developer's machine based on active sessions.",
        image:
          'https://images.unsplash.com/photo-1686170287433-c95faf6d3608?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzfHx8ZW58MHx8fHx8fA%3D%3D',
      },
      {
        id: 3,
        title: 'Monitor & Debug',
        content:
          'Real-time monitoring through our web dashboard for webhook inspection and debugging.',
        image:
          'https://images.unsplash.com/photo-1720378042271-60aff1e1c538?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        id: 4,
        title: 'Share & Collaborate',
        content:
          'Share webhook URLs across your team while maintaining individual developer environments.',
        image:
          'https://images.unsplash.com/photo-1666882990322-e7f3b8df4f75?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D',
      },
    ],
  },
  bentoSection: {
    title: 'Intelligent LLM Trace Routing',
    description:
      'Capture traces once, route them intelligently to multiple observability platforms based on your rules.',
    items: [
      {
        id: 1,
        content: <FirstBentoAnimation />,
        title: 'Universal Trace Capture',
        description:
          'Capture LLM traces through OpenAI-compatible proxy, native SDKs, or webhooks. Support for streaming and non-blocking capture.',
      },
      {
        id: 2,
        content: <SecondBentoAnimation />,
        title: '10+ Platform Integrations',
        description:
          'Pre-built integrations for LangSmith, Langfuse, Keywords.ai, Helicone, and more. Custom webhook support for any platform.',
      },
      {
        id: 3,
        content: <ThirdBentoAnimation />,
        title: 'Smart Routing Rules',
        description:
          'Route traces based on model type, cost thresholds, errors, or custom metadata. Sample intelligently to reduce costs.',
      },
      {
        id: 4,
        content: <FourthBentoAnimation once={false} />,
        title: 'Real-time Monitoring',
        description:
          'Monitor trace flow, destination health, and costs in real-time. Debug failed deliveries and test new routes.',
      },
    ],
  },
  benefits: [
    {
      id: 1,
      text: 'Reduce integration time by 80% with a single SDK instead of multiple platform-specific integrations.',
      image: '/Device-6.png',
    },
    {
      id: 2,
      text: 'Cut observability costs by 60% through intelligent sampling and routing to cost-effective platforms.',
      image: '/Device-7.png',
    },
    {
      id: 3,
      text: 'Eliminate vendor lock-in and switch between platforms without code changes.',
      image: '/Device-8.png',
    },
    {
      id: 4,
      text: 'Ensure 99.95% trace delivery with automatic failover and retry mechanisms.',
      image: '/Device-1.png',
    },
  ],
  growthSection: {
    title: 'Enterprise-Grade Infrastructure',
    description:
      'Built for scale, security, and reliability. Handle millions of traces with sub-50ms latency.',
    items: [
      {
        id: 1,
        content: (
          <div
            className="relative flex size-full items-center justify-center overflow-hidden transition-all duration-300 hover:[mask-image:none] hover:[webkit-mask-image:none]"
            style={{
              WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='265' height='268' viewBox='0 0 265 268' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M121.384 4.5393C124.406 1.99342 128.319 0.585938 132.374 0.585938C136.429 0.585938 140.342 1.99342 143.365 4.5393C173.074 29.6304 210.174 45.6338 249.754 50.4314C253.64 50.9018 257.221 52.6601 259.855 55.3912C262.489 58.1223 264.005 61.6477 264.13 65.3354C265.616 106.338 254.748 146.9 232.782 182.329C210.816 217.759 178.649 246.61 140.002 265.547C137.645 266.701 135.028 267.301 132.371 267.298C129.715 267.294 127.1 266.686 124.747 265.526C86.0991 246.59 53.9325 217.739 31.9665 182.309C10.0005 146.879 -0.867679 106.317 0.618784 65.3147C0.748654 61.6306 2.26627 58.1102 4.9001 55.3833C7.53394 52.6565 11.1121 50.9012 14.9945 50.4314C54.572 45.6396 91.6716 29.6435 121.384 4.56V4.5393Z' fill='black'/%3E%3C/svg%3E")`,
              maskImage: `url("data:image/svg+xml,%3Csvg width='265' height='268' viewBox='0 0 265 268' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M121.384 4.5393C124.406 1.99342 128.319 0.585938 132.374 0.585938C136.429 0.585938 140.342 1.99342 143.365 4.5393C173.074 29.6304 210.174 45.6338 249.754 50.4314C253.64 50.9018 257.221 52.6601 259.855 55.3912C262.489 58.1223 264.005 61.6477 264.13 65.3354C265.616 106.338 254.748 146.9 232.782 182.329C210.816 217.759 178.649 246.61 140.002 265.547C137.645 266.701 135.028 267.301 132.371 267.298C129.715 267.294 127.1 266.686 124.747 265.526C86.0991 246.59 53.9325 217.739 31.9665 182.309C10.0005 146.879 -0.867679 106.317 0.618784 65.3147C0.748654 61.6306 2.26627 58.1102 4.9001 55.3833C7.53394 52.6565 11.1121 50.9012 14.9945 50.4314C54.572 45.6396 91.6716 29.6435 121.384 4.56V4.5393Z' fill='black'/%3E%3C/svg%3E")`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          >
            <div className="absolute top-[55%] md:top-[58%] left-[55%] md:left-[57%] -translate-x-1/2 -translate-y-1/2  size-full z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="227"
                height="244"
                viewBox="0 0 227 244"
                fill="none"
                className="size-[90%] md:size-[85%] object-contain fill-background"
                role="img"
                aria-label="Security Shield Background"
              >
                <title>Security Shield Background</title>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M104.06 3.61671C106.656 1.28763 110.017 0 113.5 0C116.983 0 120.344 1.28763 122.94 3.61671C148.459 26.5711 180.325 41.2118 214.322 45.6008C217.66 46.0312 220.736 47.6398 222.999 50.1383C225.262 52.6369 226.563 55.862 226.67 59.2357C227.947 96.7468 218.612 133.854 199.744 166.267C180.877 198.68 153.248 225.074 120.052 242.398C118.028 243.454 115.779 244.003 113.498 244C111.216 243.997 108.969 243.441 106.948 242.379C73.7524 225.055 46.1231 198.661 27.2556 166.248C8.38807 133.835 -0.947042 96.7279 0.329744 59.2168C0.441295 55.8464 1.74484 52.6258 4.00715 50.1311C6.26946 47.6365 9.34293 46.0306 12.6777 45.6008C46.6725 41.2171 78.5389 26.5832 104.06 3.63565V3.61671Z"
                />
              </svg>
            </div>
            <div className="absolute top-[58%] md:top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2  size-full z-20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="245"
                height="282"
                viewBox="0 0 245 282"
                className="size-full object-contain fill-accent"
                role="img"
                aria-label="Security Shield Accent"
              >
                <title>Security Shield Accent</title>
                <g filter="url(#filter0_dddd_2_33)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M113.664 7.33065C116.025 5.21236 119.082 4.04126 122.25 4.04126C125.418 4.04126 128.475 5.21236 130.836 7.33065C154.045 28.2076 183.028 41.5233 213.948 45.5151C216.984 45.9065 219.781 47.3695 221.839 49.6419C223.897 51.9144 225.081 54.8476 225.178 57.916C226.339 92.0322 217.849 125.781 200.689 155.261C183.529 184.74 158.4 208.746 128.209 224.501C126.368 225.462 124.323 225.962 122.248 225.959C120.173 225.956 118.13 225.45 116.291 224.484C86.0997 208.728 60.971 184.723 43.811 155.244C26.6511 125.764 18.1608 92.015 19.322 57.8988C19.4235 54.8334 20.6091 51.9043 22.6666 49.6354C24.7242 47.3665 27.5195 45.906 30.5524 45.5151C61.4706 41.5281 90.4531 28.2186 113.664 7.34787V7.33065Z"
                  />
                </g>
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="81"
                height="80"
                viewBox="0 0 81 80"
                className="fill-background"
                role="img"
                aria-label="Lock Icon"
              >
                <title>Lock Icon</title>
                <g filter="url(#filter0_iiii_2_34)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M20.5 36V28C20.5 22.6957 22.6071 17.6086 26.3579 13.8579C30.1086 10.1071 35.1957 8 40.5 8C45.8043 8 50.8914 10.1071 54.6421 13.8579C58.3929 17.6086 60.5 22.6957 60.5 28V36C62.6217 36 64.6566 36.8429 66.1569 38.3431C67.6571 39.8434 68.5 41.8783 68.5 44V64C68.5 66.1217 67.6571 68.1566 66.1569 69.6569C64.6566 71.1571 62.6217 72 60.5 72H20.5C18.3783 72 16.3434 71.1571 14.8431 69.6569C13.3429 68.1566 12.5 66.1217 12.5 64V44C12.5 41.8783 13.3429 39.8434 14.8431 38.3431C16.3434 36.8429 18.3783 36 20.5 36ZM52.5 28V36H28.5V28C28.5 24.8174 29.7643 21.7652 32.0147 19.5147C34.2652 17.2643 37.3174 16 40.5 16C43.6826 16 46.7348 17.2643 48.9853 19.5147C51.2357 21.7652 52.5 24.8174 52.5 28Z"
                  />
                </g>
              </svg>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="size-full"
            >
              <FlickeringGrid
                className="size-full"
                gridGap={4}
                squareSize={2}
                maxOpacity={0.5}
              />
            </motion.div>
          </div>
        ),
        title: 'SOC2 Type II Compliant',
        description:
          'Enterprise-grade security with encryption in transit and at rest. Automatic PII detection and redaction.',
      },
      {
        id: 2,
        content: (
          <div className="relative flex size-full max-w-lg items-center justify-center overflow-hidden [mask-image:linear-gradient(to_top,transparent,black_50%)] -translate-y-20">
            <Globe className="top-28" />
          </div>
        ),
        title: 'Global Edge Network',
        description:
          'Multi-region deployment with automatic failover. Sub-50ms P95 latency overhead globally.',
      },
    ],
  },
  quoteSection: {
    quote:
      'Untrace saved us from observability hell. We went from maintaining 4 different integrations to just one, and our monitoring costs dropped by 60%.',
    author: {
      name: 'Dana Chen',
      role: 'Engineering Manager, Acme Corp',
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
    },
  },
  pricing: {
    title: 'Simple, usage-based pricing',
    description:
      'Start free and scale as you grow. No hidden fees, just pay for what you use.',
    pricingItems: [
      {
        name: 'Free',
        href: '#',
        price: '$0',
        period: 'month',
        yearlyPrice: '$0',
        features: [
          '100K traces/month',
          '2 destinations',
          'Basic routing rules',
          'Community support',
          '7-day retention',
        ],
        description: 'Perfect for trying out Untrace',
        buttonText: 'Start Free',
        buttonColor: 'bg-accent text-primary',
        isPopular: false,
      },
      {
        name: 'Growth',
        href: '#',
        price: '$99',
        period: 'month',
        yearlyPrice: '$990',
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
        description: 'For growing AI teams',
        buttonText: 'Start Trial',
        buttonColor: 'bg-secondary text-white',
        isPopular: true,
      },
      {
        name: 'Scale',
        href: '#',
        price: '$499',
        period: 'month',
        yearlyPrice: '$4,990',
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
        description: 'For teams at scale',
        buttonText: 'Contact Sales',
        buttonColor: 'bg-primary text-primary-foreground',
        isPopular: false,
      },
    ],
  },
  testimonials: [
    {
      id: '1',
      name: 'Alex Rivera',
      role: 'CTO at FinanceAI',
      img: 'https://randomuser.me/api/portraits/men/91.jpg',
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
    },
    {
      id: '2',
      name: 'Samantha Lee',
      role: 'Engineering Lead at ChatBot Inc',
      img: 'https://randomuser.me/api/portraits/women/12.jpg',
      description: (
        <p>
          The cost savings are incredible. We&apos;re sampling non-critical
          traces and only sending errors to expensive platforms.
          <Highlight>Our observability costs dropped by 70%!</Highlight> Untrace
          paid for itself in the first week.
        </p>
      ),
    },
    {
      id: '3',
      name: 'Raj Patel',
      role: 'Founder & CEO at AI Startup',
      img: 'https://randomuser.me/api/portraits/men/45.jpg',
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
    },
    {
      id: '4',
      name: 'Emily Chen',
      role: 'Platform Engineer at ScaleAI',
      img: 'https://randomuser.me/api/portraits/women/83.jpg',
      description: (
        <p>
          The reliability is outstanding. With automatic failover, we never lose
          traces even when destinations are down.
          <Highlight>99.99% delivery rate has been game-changing.</Highlight>{' '}
          Our AI ops team loves Untrace.
        </p>
      ),
    },
    {
      id: '5',
      name: 'Michael Brown',
      role: 'Data Scientist at LLM Labs',
      img: 'https://randomuser.me/api/portraits/men/1.jpg',
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
    },
    {
      id: '6',
      name: 'Linda Wu',
      role: 'VP of Engineering at Enterprise Co',
      img: 'https://randomuser.me/api/portraits/women/5.jpg',
      description: (
        <p>
          The PII detection and redaction gives us peace of mind. We can route
          sanitized traces to cloud platforms while keeping raw data on-premise.
          <Highlight>
            Compliance and observability finally work together.
          </Highlight>{' '}
        </p>
      ),
    },
    {
      id: '7',
      name: 'Carlos Gomez',
      role: 'Head of AI at HealthTech',
      img: 'https://randomuser.me/api/portraits/men/14.jpg',
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
    },
    {
      id: '8',
      name: 'Aisha Khan',
      role: 'Chief Architect at AI Platform',
      img: 'https://randomuser.me/api/portraits/women/56.jpg',
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
    },
    {
      id: '9',
      name: 'Tom Wilson',
      role: 'Director of MLOps at Tech Giant',
      img: 'https://randomuser.me/api/portraits/men/18.jpg',
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
    },
    {
      id: '10',
      name: 'Sofia Martinez',
      role: 'CEO at AI Consulting',
      img: 'https://randomuser.me/api/portraits/women/73.jpg',
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
    },
  ],
  faqSection: {
    title: 'Frequently Asked Questions',
    description:
      "Everything you need to know about Untrace. Can't find what you're looking for? Contact our support team.",
    faQitems: [
      {
        id: 1,
        question: 'What is Untrace?',
        answer:
          'Untrace is a middleware platform that captures LLM traces from your AI applications and intelligently routes them to multiple observability platforms like LangSmith, Langfuse, Keywords.ai, and others. Think of it as "Segment for LLM traces" - you integrate once with us, and we handle the complexity of sending your data to any observability platform.',
      },
      {
        id: 2,
        question: 'How does Untrace work?',
        answer:
          'Untrace provides three ways to capture traces: 1) OpenAI-compatible proxy (just change your base URL), 2) Native SDKs that drop in to replace OpenAI SDKs, and 3) Webhook API for custom integrations. Once captured, our routing engine evaluates your rules and sends traces to the appropriate destinations in their required formats.',
      },
      {
        id: 3,
        question: 'What is the performance impact?',
        answer:
          'Untrace adds less than 50ms latency (P95) to your LLM calls. Our infrastructure uses global edge locations, asynchronous trace processing, and automatic failover to ensure minimal impact on your application performance while guaranteeing 99.95% uptime.',
      },
      {
        id: 4,
        question: 'Which platforms do you support?',
        answer:
          'We currently support 10+ destinations including LangSmith, Langfuse (cloud & self-hosted), Keywords.ai, Helicone, Phoenix/Arize, Datadog APM, custom webhooks, and data lakes (S3/GCS). We add new integrations monthly based on customer demand.',
      },
      {
        id: 5,
        question: 'How does pricing work?',
        answer:
          'We offer usage-based pricing with a generous free tier (100K traces/month). Paid plans start at $99/month for 10M traces. Unlike maintaining multiple direct integrations, Untrace is typically 80% cheaper while providing more flexibility and features.',
      },
      {
        id: 6,
        question: 'Is my data secure?',
        answer:
          'Security is our top priority. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We provide automatic PII detection and redaction, are SOC2 Type II compliant, and only store data temporarily for routing (with configurable retention). You maintain full control over where your data goes.',
      },
      {
        id: 7,
        question: 'Can I filter or sample traces?',
        answer:
          'Yes! Untrace provides powerful filtering and sampling capabilities. You can route by model type, cost, error conditions, or custom metadata. Use percentage-based sampling, cost thresholds, or error-biased sampling to optimize costs while maintaining visibility into critical traces.',
      },
      {
        id: 8,
        question: 'Do you support self-hosted deployment?',
        answer:
          'We plan to offer self-hosted options for enterprise customers in Q3 2025. This will allow you to run Untrace in your own infrastructure while maintaining all the benefits of our routing platform. Contact us to join the early access program.',
      },
    ],
  },
  ctaSection: {
    id: 'cta',
    title: 'End Observability Tool Sprawl',
    backgroundImage: '/agent-cta-background.png',
    button: {
      text: 'Start Your Free Trial',
      href: '/signup?utm_source=marketing-site&utm_medium=cta-button',
    },
    subtext: 'Join teams saving 80% on integration time',
  },
  footerLinks: [
    {
      title: 'Company',
      links: [
        { id: 1, title: 'Privacy Policy', url: '/privacy-policy' },
        { id: 2, title: 'Terms of Service', url: '/terms-of-service' },
      ],
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
};

export type SiteConfig = typeof siteConfig;
