import Stripe from 'stripe';
import { env } from '../src/env.server';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// Constants
const CONSTANTS = {
  CENTS_MULTIPLIER: 100,
  DEFAULT_CURRENCY: 'usd' as const,
  YEARLY_DISCOUNT_RATE: 0.83333, // 20% discount for yearly plans (24/30 = 0.8)
} as const;

// Types
interface BillingInterval {
  type: 'month' | 'year';
  label: 'monthly' | 'yearly';
}

interface Entitlement {
  name: string;
  lookupKey: string;
  id?: string;
}

interface PlanConfig {
  id: string;
  name: string;
  description: string;
  baseFeeCents: number;
  includedWebhookEvents: number; // Monthly LLM traces or daily webhook events
  pricingModel: 'flat' | 'per_user';
  baseUsers?: number; // Number of users included in base price
  pricePerUserCents?: number; // Cost per additional user
  features: string[];
  lookup_keys: {
    monthly: string;
    monthly_metered?: string;
    yearly?: string;
    yearly_metered?: string;
  };
  entitlements?: Entitlement[];
}

// Plan configurations based on Untrace's pricing
const PLANS: PlanConfig[] = [
  {
    baseFeeCents: 0,
    description:
      'Perfect for individual developers getting started with LLM observability',
    entitlements: [
      {
        lookupKey: 'llm_traces_100_per_month',
        name: '100 LLM Traces Per Month',
      },
      {
        lookupKey: 'single_integration',
        name: 'Single Platform Integration',
      },
      {
        lookupKey: 'basic_monitoring',
        name: 'Basic Trace Monitoring',
      },
      {
        lookupKey: 'cli_access',
        name: 'CLI Access',
      },
      {
        lookupKey: 'local_trace_routing',
        name: 'Local Trace Routing',
      },
      {
        lookupKey: 'public_webhook_endpoints',
        name: 'Public Webhook Endpoints',
      },
      {
        lookupKey: 'community_support',
        name: 'Community Support',
      },
    ],
    features: [
      'CLI access for trace capture',
      '100 LLM traces per month',
      '1 platform integration',
      'Basic trace monitoring',
      'Local trace routing',
      'Single developer',
      'Public webhook endpoints',
      'Community support',
    ],
    id: 'free',
    includedWebhookEvents: 100,
    lookup_keys: {
      monthly: 'untrace_free_2025_01_monthly',
    },
    name: 'Free Plan',
    pricingModel: 'flat',
  },
  {
    baseFeeCents: 99 * CONSTANTS.CENTS_MULTIPLIER,
    baseUsers: 1,
    description: 'Ideal for development teams with unlimited LLM trace routing',
    entitlements: [
      {
        lookupKey: 'unlimited_llm_traces',
        name: 'Unlimited LLM Traces',
      },
      {
        lookupKey: 'unlimited_integrations',
        name: 'Unlimited Platform Integrations',
      },
      {
        lookupKey: 'ai_powered_debugging',
        name: 'AI-Powered Trace Analysis',
      },
      {
        lookupKey: 'advanced_routing_rules',
        name: 'Advanced Routing Rules',
      },
      {
        lookupKey: 'team_trace_sharing',
        name: 'Team Trace Sharing',
      },
      {
        lookupKey: 'unlimited_developers',
        name: 'Unlimited Developers',
      },
      {
        lookupKey: 'private_endpoints',
        name: 'Private Endpoints',
      },
      {
        lookupKey: 'custom_transformations',
        name: 'Custom Trace Transformations',
      },
      {
        lookupKey: 'custom_subdomains',
        name: 'Custom Subdomains',
      },
      {
        lookupKey: 'advanced_monitoring_analytics',
        name: 'Advanced Monitoring & Analytics',
      },
      {
        lookupKey: 'external_integrations',
        name: 'External Platform Integrations',
      },
    ],
    features: [
      'AI-Powered trace analysis',
      'Advanced routing rules',
      'Unlimited LLM traces',
      'Unlimited platform integrations',
      'Team trace sharing',
      'Unlimited developers',
      'Private endpoints',
      'Custom trace transformations',
      'Custom subdomains',
      'Advanced monitoring & analytics',
      'External platform integrations',
    ],
    id: 'growth',
    includedWebhookEvents: -1,
    lookup_keys: {
      monthly: 'untrace_growth_2025_01_monthly',
      yearly: 'untrace_growth_2025_01_yearly',
    },
    name: 'Growth Plan',
    pricePerUserCents: 99 * CONSTANTS.CENTS_MULTIPLIER,
    pricingModel: 'per_user',
  },
  {
    baseFeeCents: 499 * CONSTANTS.CENTS_MULTIPLIER,
    baseUsers: 5,
    description: 'Enterprise-grade LLM observability with advanced features',
    entitlements: [
      {
        lookupKey: 'enterprise_llm_traces',
        name: 'Enterprise LLM Traces',
      },
      {
        lookupKey: 'enterprise_integrations',
        name: 'Enterprise Platform Integrations',
      },
      {
        lookupKey: 'enterprise_ai_analysis',
        name: 'Enterprise AI Analysis',
      },
      {
        lookupKey: 'enterprise_routing_rules',
        name: 'Enterprise Routing Rules',
      },
      {
        lookupKey: 'enterprise_team_features',
        name: 'Enterprise Team Features',
      },
      {
        lookupKey: 'enterprise_developers',
        name: 'Enterprise Developer Access',
      },
      {
        lookupKey: 'enterprise_endpoints',
        name: 'Enterprise Endpoints',
      },
      {
        lookupKey: 'enterprise_transformations',
        name: 'Enterprise Transformations',
      },
      {
        lookupKey: 'enterprise_subdomains',
        name: 'Enterprise Subdomains',
      },
      {
        lookupKey: 'enterprise_monitoring',
        name: 'Enterprise Monitoring',
      },
      {
        lookupKey: 'enterprise_integrations',
        name: 'Enterprise Integrations',
      },
      {
        lookupKey: 'dedicated_support',
        name: 'Dedicated Support',
      },
    ],
    features: [
      'Enterprise AI analysis',
      'Enterprise routing rules',
      'Enterprise LLM traces',
      'Enterprise platform integrations',
      'Enterprise team features',
      'Enterprise developer access',
      'Enterprise endpoints',
      'Enterprise transformations',
      'Enterprise subdomains',
      'Enterprise monitoring',
      'Enterprise integrations',
      'Dedicated support',
    ],
    id: 'scale',
    includedWebhookEvents: -1,
    lookup_keys: {
      monthly: 'untrace_scale_2025_01_monthly',
      yearly: 'untrace_scale_2025_01_yearly',
    },
    name: 'Scale Plan',
    pricePerUserCents: 99 * CONSTANTS.CENTS_MULTIPLIER,
    pricingModel: 'per_user',
  },
];

// Addon configurations
interface AddonConfig {
  id: string;
  name: string;
  description: string;
  baseFeeCents: number;
  features: string[];
  lookup_keys: {
    monthly: string;
    yearly: string;
  };
  entitlements?: Entitlement[];
}

const ADDONS: AddonConfig[] = [
  {
    baseFeeCents: 500 * CONSTANTS.CENTS_MULTIPLIER,
    description: 'Get dedicated support through a private Slack channel',
    entitlements: [
      {
        lookupKey: 'dedicated_slack_support',
        name: 'Dedicated Slack Support',
      },
    ],
    features: [
      'Dedicated Slack channel',
      'Direct access to support team',
      'Priority issue resolution',
      '4-hour response time SLA',
    ],
    id: 'dedicated_support',
    lookup_keys: {
      monthly: 'untrace_dedicated_support_2025_01_monthly',
      yearly: 'untrace_dedicated_support_2025_01_yearly',
    },
    name: 'Dedicated Support',
  },
  {
    baseFeeCents: 200 * CONSTANTS.CENTS_MULTIPLIER,
    description: 'Advanced AI-powered trace analysis and debugging',
    entitlements: [
      {
        lookupKey: 'advanced_ai_analysis',
        name: 'Advanced AI Analysis',
      },
    ],
    features: [
      'AI-powered trace debugging',
      'Intelligent error detection',
      'Performance optimization insights',
      'Custom trace analysis rules',
    ],
    id: 'advanced_ai_analysis',
    lookup_keys: {
      monthly: 'untrace_advanced_ai_analysis_2025_01_monthly',
      yearly: 'untrace_advanced_ai_analysis_2025_01_yearly',
    },
    name: 'Advanced AI Analysis',
  },
  {
    baseFeeCents: 150 * CONSTANTS.CENTS_MULTIPLIER,
    description: 'Custom trace transformations and data processing',
    entitlements: [
      {
        lookupKey: 'custom_transformations',
        name: 'Custom Transformations',
      },
    ],
    features: [
      'Custom trace transformations',
      'Data enrichment',
      'Format conversion',
      'Conditional routing logic',
    ],
    id: 'custom_transformations',
    lookup_keys: {
      monthly: 'untrace_custom_transformations_2025_01_monthly',
      yearly: 'untrace_custom_transformations_2025_01_yearly',
    },
    name: 'Custom Transformations',
  },
];

// Utility functions
function calculateYearlyAmount(monthlyAmount: number): number {
  // Apply 20% discount to annual pricing: monthly * 12 * 0.8
  // For Growth plan: $99/month * 12 * 0.8 = $950/year
  return Math.floor(monthlyAmount * 12 * CONSTANTS.YEARLY_DISCOUNT_RATE);
}

function calculateYearlyPerUserAmount(monthlyPerUserAmount: number): number {
  // Apply 20% discount to annual per-user pricing: monthly * 12 * 0.8
  // For Growth plan per-user: $99/month * 12 * 0.8 = $950/year per additional seat
  return Math.floor(monthlyPerUserAmount * 12 * CONSTANTS.YEARLY_DISCOUNT_RATE);
}

// Helper function to add delay between API calls
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to retry API calls
async function _retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      // If it's a 500 error, wait longer before retrying
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        error.statusCode === 500
      ) {
        console.log(
          `API call failed with 500 error, retrying in ${delayMs * 2}ms... (attempt ${i + 1}/${maxRetries})`,
        );
        await delay(delayMs * 2);
      } else {
        console.log(
          `API call failed, retrying in ${delayMs}ms... (attempt ${i + 1}/${maxRetries})`,
        );
        await delay(delayMs);
      }
    }
  }
  throw new Error('Max retries exceeded');
}

async function createOrUpdatePrice(params: {
  product: string;
  amount: number;
  interval: BillingInterval['type'];
  includedUsers?: number;
  pricePerUserCents?: number;
  lookupKey: string;
  metadata: Record<string, string | number>;
}): Promise<Stripe.Price> {
  const {
    product,
    amount,
    interval,
    includedUsers,
    pricePerUserCents,
    lookupKey,
    metadata,
  } = params;

  // Try to find existing price
  const existingPrices = await stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
  });

  if (existingPrices.data.length > 0 && existingPrices.data[0]) {
    return existingPrices.data[0];
  }

  const basePrice = {
    currency: CONSTANTS.DEFAULT_CURRENCY,
    lookup_key: lookupKey,
    metadata,
    nickname: `${metadata.type === 'addon' ? 'Add-on' : 'Base'} price (${interval}ly) with ${includedUsers ? `${includedUsers} included users` : 'fixed pricing'} for LLM observability`,
    product,
    recurring: {
      interval,
    },
  } satisfies Stripe.PriceCreateParams;

  // For per-seat billing (Team plan) or fixed pricing
  if (includedUsers !== undefined && pricePerUserCents !== undefined) {
    return stripe.prices.create({
      ...basePrice,
      billing_scheme: 'tiered',
      tiers: [
        {
          flat_amount: amount, // Base price for first N users
          unit_amount: 0,
          up_to: includedUsers,
        },
        {
          unit_amount: pricePerUserCents, // Per-user price for additional users
          up_to: 'inf',
        },
      ],
      tiers_mode: 'graduated',
    });
  }

  return stripe.prices.create({
    ...basePrice,
    unit_amount: amount,
  });
}

async function findOrCreateFeatureEntitlements(
  entitlements: Entitlement[],
): Promise<Entitlement[]> {
  if (!entitlements.length) {
    return [];
  }

  const createdEntitlements = await Promise.all(
    entitlements.map(async (entitlement) => {
      const existingFeatures = await stripe.entitlements.features.list({
        lookup_key: entitlement.lookupKey,
      });

      if (existingFeatures.data.length > 0 && existingFeatures.data[0]) {
        console.log(
          `Found existing entitlement feature: ${entitlement.name}`,
          existingFeatures.data[0].id,
        );
        return { ...entitlement, id: existingFeatures.data[0].id };
      }

      const newFeature = await stripe.entitlements.features.create({
        lookup_key: entitlement.lookupKey,
        name: entitlement.name,
      });
      console.log(
        `Created new entitlement feature: ${entitlement.name}`,
        newFeature.id,
      );
      return { ...entitlement, id: newFeature.id };
    }),
  );

  return createdEntitlements;
}

async function attachFeatureToProduct({
  productId,
  entitlementId,
}: {
  productId: string;
  entitlementId: string;
}): Promise<Stripe.Response<Stripe.ProductFeature> | null> {
  try {
    // First, check if the feature is already attached to this product
    const existingFeatures = await stripe.products.listFeatures(productId);
    const isAlreadyAttached = existingFeatures.data.some(
      (feature) =>
        feature.entitlement_feature &&
        feature.entitlement_feature.id === entitlementId,
    );

    if (isAlreadyAttached) {
      console.log(
        `Feature ${entitlementId} is already attached to product ${productId}`,
      );
      return null;
    }

    // If not attached, attach it
    const result = await stripe.products.createFeature(productId, {
      entitlement_feature: entitlementId,
    });
    console.log(`Attached feature ${entitlementId} to product ${productId}`);
    return result;
  } catch (error) {
    // If the error is about the feature already being attached, ignore it
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('more than once')
    ) {
      console.log(
        `Feature ${entitlementId} is already attached to product ${productId} (ignoring error)`,
      );
      return null;
    }
    throw error;
  }
}

async function findOrCreateProduct(
  plan: PlanConfig,
  entitlements: Entitlement[],
): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    active: true,
  });

  const existingProduct = existingProducts.data.find(
    (p) => p.name === `Untrace ${plan.name}`,
  );

  if (existingProduct) {
    const updatedProduct = await stripe.products.update(existingProduct.id, {
      description: plan.description,
      marketing_features: plan.features.map((feature) => ({
        name: feature,
      })),
    });

    // Attach entitlements to existing product
    await Promise.all(
      entitlements.map((entitlement) =>
        entitlement.id
          ? attachFeatureToProduct({
              entitlementId: entitlement.id,
              productId: updatedProduct.id,
            })
          : Promise.resolve(),
      ),
    );

    console.log(`Updated existing product: ${plan.name}`, updatedProduct.id);
    return updatedProduct;
  }

  const product = await stripe.products.create({
    description: plan.description,
    marketing_features: plan.features.map((feature) => ({
      name: feature,
    })),
    name: `Untrace ${plan.name}`,
  });

  // Attach entitlements to new product
  await Promise.all(
    entitlements.map((entitlement) =>
      entitlement.id
        ? attachFeatureToProduct({
            entitlementId: entitlement.id,
            productId: product.id,
          })
        : Promise.resolve(),
    ),
  );

  console.log(`Created new product: ${plan.name}`, product.id);
  return product;
}

async function findOrCreateAddonProduct(
  addon: AddonConfig,
  entitlements: Entitlement[],
): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    active: true,
  });

  const existingProduct = existingProducts.data.find(
    (p) => p.name === `Untrace ${addon.name}`,
  );

  if (existingProduct) {
    const updatedProduct = await stripe.products.update(existingProduct.id, {
      description: addon.description,
      metadata: {
        features: JSON.stringify(addon.features),
      },
    });

    // Attach entitlements to existing product
    await Promise.all(
      entitlements.map((entitlement) =>
        entitlement.id
          ? attachFeatureToProduct({
              entitlementId: entitlement.id,
              productId: updatedProduct.id,
            })
          : Promise.resolve(),
      ),
    );

    console.log(`Updated existing addon: ${addon.name}`, updatedProduct.id);
    return updatedProduct;
  }

  const product = await stripe.products.create({
    description: addon.description,
    metadata: {
      features: JSON.stringify(addon.features),
    },
    name: `Untrace ${addon.name}`,
  });

  // Attach entitlements to new product
  await Promise.all(
    entitlements.map((entitlement) =>
      entitlement.id
        ? attachFeatureToProduct({
            entitlementId: entitlement.id,
            productId: product.id,
          })
        : Promise.resolve(),
    ),
  );

  console.log(`Created new addon: ${addon.name}`, product.id);
  return product;
}

async function main() {
  try {
    console.log('Starting Stripe entities creation...');

    // 3. Process each plan
    for (const plan of PLANS) {
      console.log(`Processing plan: ${plan.id}`);

      // 3.a Create or find plan-specific entitlements
      console.log(`Creating/finding entitlements for plan: ${plan.id}`);
      const entitlements = await findOrCreateFeatureEntitlements(
        plan.entitlements ?? [],
      );

      // 3.b Create or update the base product with entitlements
      console.log(`Creating/updating product for plan: ${plan.id}`);
      const baseProduct = await findOrCreateProduct(plan, entitlements);

      // 3.c Create prices based on pricing model
      if (plan.pricingModel === 'per_user') {
        console.log(`Creating per-seat prices for plan: ${plan.id}`);
        // Per-seat pricing for Growth/Scale plans using Stripe's native per-seat billing
        const monthlyPrice = await createOrUpdatePrice({
          amount: plan.baseFeeCents,
          includedUsers: plan.baseUsers,
          interval: 'month',
          lookupKey: plan.lookup_keys.monthly,
          metadata: {
            billing_period: 'monthly',
            included_users: plan.baseUsers?.toString() ?? '0',
            llm_traces:
              plan.includedWebhookEvents === -1
                ? 'unlimited'
                : plan.includedWebhookEvents.toString(),
            plan_id: plan.id,
            price_per_user_cents: plan.pricePerUserCents?.toString() ?? '0',
            type: 'per_seat',
          },
          pricePerUserCents: plan.pricePerUserCents,
          product: baseProduct.id,
        });

        if (plan.lookup_keys.yearly) {
          const yearlyPrice = await createOrUpdatePrice({
            amount: calculateYearlyAmount(plan.baseFeeCents),
            includedUsers: plan.baseUsers,
            interval: 'year',
            lookupKey: plan.lookup_keys.yearly,
            metadata: {
              billing_period: 'yearly',
              included_users: plan.baseUsers?.toString() ?? '0',
              llm_traces:
                plan.includedWebhookEvents === -1
                  ? 'unlimited'
                  : plan.includedWebhookEvents.toString(),
              plan_id: plan.id,
              price_per_user_cents:
                calculateYearlyPerUserAmount(
                  plan.pricePerUserCents ?? 0,
                ).toString() ?? '0',
              type: 'per_seat',
            },
            pricePerUserCents: calculateYearlyPerUserAmount(
              plan.pricePerUserCents ?? 0,
            ),
            product: baseProduct.id,
          });

          console.log(`Plan ${plan.id} provisioned (per-seat):`, {
            baseProduct: baseProduct.id,
            monthlyPrice: monthlyPrice.id,
            yearlyPrice: yearlyPrice.id,
          });
        } else {
          console.log(`Plan ${plan.id} provisioned (per-seat):`, {
            baseProduct: baseProduct.id,
            monthlyPrice: monthlyPrice.id,
          });
        }
      } else {
        console.log(`Creating free price for plan: ${plan.id}`);
        // Create a free price for the free plan to enable subscription management
        const freePrice = await createOrUpdatePrice({
          amount: 0,
          interval: 'month',
          lookupKey: plan.lookup_keys.monthly,
          metadata: {
            billing_period: 'monthly',
            llm_traces:
              plan.includedWebhookEvents === -1
                ? 'unlimited'
                : plan.includedWebhookEvents.toString(),
            plan_id: plan.id,
            type: 'free',
          },
          product: baseProduct.id,
        });

        console.log(`Plan ${plan.id} provisioned (free):`, {
          baseProduct: baseProduct.id,
          freePrice: freePrice.id,
        });
      }
    }

    // 4. Process each addon
    for (const addon of ADDONS) {
      console.log(`Processing addon: ${addon.id}`);

      // 4.a Create or find addon-specific entitlements
      const entitlements = await findOrCreateFeatureEntitlements(
        addon.entitlements ?? [],
      );

      // 4.b Create or update the product with entitlements
      const product = await findOrCreateAddonProduct(addon, entitlements);

      // 4.c Create monthly and yearly prices for the addon
      const [monthlyPrice, yearlyPrice] = await Promise.all([
        createOrUpdatePrice({
          amount: addon.baseFeeCents,
          interval: 'month',
          lookupKey: addon.lookup_keys.monthly,
          metadata: {
            addon_id: addon.id,
            billing_period: 'monthly',
            llm_observability: 'true',
            type: 'addon',
          },
          product: product.id,
        }),
        createOrUpdatePrice({
          amount: calculateYearlyAmount(addon.baseFeeCents),
          interval: 'year',
          lookupKey: addon.lookup_keys.yearly,
          metadata: {
            addon_id: addon.id,
            billing_period: 'yearly',
            llm_observability: 'true',
            type: 'addon',
          },
          product: product.id,
        }),
      ]);

      console.log(`Addon ${addon.id} provisioned:`, {
        monthlyPrice: monthlyPrice.id,
        product: product.id,
        yearlyPrice: yearlyPrice.id,
      });
    }

    console.log(
      'Successfully created or updated all Untrace LLM observability products, prices, and addons!',
    );
  } catch (error) {
    console.error('Error creating or updating products and prices:', error);

    // Add more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // If it's a Stripe error, log additional details
    if (error && typeof error === 'object' && 'raw' in error) {
      console.error(
        'Stripe error details:',
        JSON.stringify(error.raw, null, 2),
      );
    }

    throw error;
  }
}

// Execute the creation
main().catch(console.error);
