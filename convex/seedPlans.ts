/**
 * Seed Subscription Plans
 * 
 * This script initializes the default subscription plans for the SaaS platform.
 * Run this once during initial setup.
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedSubscriptionPlans = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if plans already exist
    const existingPlans = await ctx.db.query("subscriptionPlans").collect();
    if (existingPlans.length > 0) {
      console.log("Plans already seeded");
      return { success: true, message: "Plans already exist" };
    }

    // Free Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "free",
      displayName: "Free",
      description: "Perfect for trying out the platform and building simple apps",
      isActive: true,
      monthlyPrice: 0,
      currency: "USD",
      monthlyCredits: 1000,
      rolloverCredits: false,
      maxProjects: 3,
      maxApiIntegrations: 2,
      maxTeamMembers: 1,
      maxDeployments: 5,
      features: [
        "1,000 credits/month",
        "3 projects",
        "2 API integrations",
        "Community support",
        "Basic analytics",
      ],
      apiRateLimit: 60, // 60 requests per minute
      sortOrder: 1,
    });

    // Starter Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "starter",
      displayName: "Starter",
      description: "Great for indie developers and small projects",
      isActive: true,
      monthlyPrice: 2900, // $29/month
      yearlyPrice: 29000, // $290/year (save $58)
      currency: "USD",
      monthlyCredits: 10000,
      rolloverCredits: true,
      maxRolloverCredits: 5000,
      maxProjects: 10,
      maxApiIntegrations: 10,
      maxTeamMembers: 3,
      maxDeployments: 50,
      features: [
        "10,000 credits/month",
        "Rollover up to 5,000 credits",
        "10 projects",
        "10 API integrations",
        "3 team members",
        "Email support",
        "Advanced analytics",
        "Custom domains",
      ],
      apiRateLimit: 300, // 300 requests per minute
      sortOrder: 2,
      stripePriceIdMonthly: "price_starter_monthly", // Replace with actual Stripe price IDs
      stripePriceIdYearly: "price_starter_yearly",
      stripeProductId: "prod_starter",
    });

    // Pro Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "pro",
      displayName: "Pro",
      description: "For professional developers and growing teams",
      isActive: true,
      monthlyPrice: 9900, // $99/month
      yearlyPrice: 99000, // $990/year (save $198)
      currency: "USD",
      monthlyCredits: 50000,
      rolloverCredits: true,
      maxRolloverCredits: 25000,
      maxProjects: 50,
      maxApiIntegrations: 50,
      maxTeamMembers: 10,
      maxDeployments: "unlimited",
      features: [
        "50,000 credits/month",
        "Rollover up to 25,000 credits",
        "50 projects",
        "50 API integrations",
        "10 team members",
        "Priority email & chat support",
        "Advanced analytics & reporting",
        "Custom domains",
        "White-label options",
        "SSO (Single Sign-On)",
        "Advanced webhooks",
      ],
      apiRateLimit: 1000, // 1000 requests per minute
      sortOrder: 3,
      stripePriceIdMonthly: "price_pro_monthly",
      stripePriceIdYearly: "price_pro_yearly",
      stripeProductId: "prod_pro",
    });

    // Enterprise Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "enterprise",
      displayName: "Enterprise",
      description: "Custom solutions for large organizations",
      isActive: true,
      monthlyPrice: 49900, // $499/month (starting price)
      yearlyPrice: 499000, // $4,990/year
      currency: "USD",
      monthlyCredits: 250000,
      rolloverCredits: true,
      maxRolloverCredits: 125000,
      maxProjects: "unlimited",
      maxApiIntegrations: "unlimited",
      maxTeamMembers: "unlimited",
      maxDeployments: "unlimited",
      features: [
        "250,000+ credits/month (customizable)",
        "Unlimited rollover",
        "Unlimited projects",
        "Unlimited API integrations",
        "Unlimited team members",
        "24/7 dedicated support",
        "Custom analytics & reporting",
        "Custom domains & white-label",
        "SSO & advanced security",
        "SLA guarantees",
        "Custom integrations",
        "On-premise deployment option",
        "Dedicated account manager",
        "Custom contract terms",
      ],
      apiRateLimit: 5000, // 5000 requests per minute
      sortOrder: 4,
      stripePriceIdMonthly: "price_enterprise_monthly",
      stripePriceIdYearly: "price_enterprise_yearly",
      stripeProductId: "prod_enterprise",
    });

    console.log("Successfully seeded subscription plans");
    return { success: true, message: "Plans seeded successfully" };
  },
});

/**
 * Update Stripe price IDs for existing plans
 */
export const updateStripePriceIds = internalMutation({
  args: {
    planName: v.string(),
    stripePriceIdMonthly: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
  },
  handler: async (ctx, { planName, stripePriceIdMonthly, stripePriceIdYearly, stripeProductId }) => {
    const plan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("byName", (q) => q.eq("name", planName))
      .first();
    
    if (!plan) {
      throw new Error(`Plan ${planName} not found`);
    }
    
    await ctx.db.patch(plan._id, {
      stripePriceIdMonthly,
      stripePriceIdYearly,
      stripeProductId,
    });
    
    return { success: true };
  },
});
