/**
 * Billing & Subscription Management
 * 
 * This module handles all billing-related operations including:
 * - Subscription management
 * - Credit allocation and tracking
 * - Usage metering
 * - Payment processing
 */

import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// ========== SUBSCRIPTION PLANS ==========

/**
 * Get all active subscription plans
 */
export const getSubscriptionPlans = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("subscriptionPlans")
      .withIndex("byIsActive", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
    
    return plans;
  },
});

/**
 * Get a specific plan by ID
 */
export const getSubscriptionPlan = query({
  args: { planId: v.id("subscriptionPlans") },
  handler: async (ctx, { planId }) => {
    return await ctx.db.get(planId);
  },
});

/**
 * Create a new subscription plan (admin only)
 */
export const createSubscriptionPlan = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    monthlyPrice: v.number(),
    yearlyPrice: v.optional(v.number()),
    currency: v.string(),
    monthlyCredits: v.number(),
    rolloverCredits: v.boolean(),
    maxRolloverCredits: v.optional(v.number()),
    maxProjects: v.union(v.number(), v.literal("unlimited")),
    maxApiIntegrations: v.union(v.number(), v.literal("unlimited")),
    maxTeamMembers: v.union(v.number(), v.literal("unlimited")),
    maxDeployments: v.union(v.number(), v.literal("unlimited")),
    features: v.array(v.string()),
    apiRateLimit: v.number(),
    sortOrder: v.number(),
    stripePriceIdMonthly: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin authentication check
    
    const planId = await ctx.db.insert("subscriptionPlans", {
      ...args,
      isActive: true,
    });
    
    return planId;
  },
});

/**
 * Update a subscription plan
 */
export const updateSubscriptionPlan = mutation({
  args: {
    planId: v.id("subscriptionPlans"),
    updates: v.object({
      displayName: v.optional(v.string()),
      description: v.optional(v.string()),
      monthlyPrice: v.optional(v.number()),
      yearlyPrice: v.optional(v.number()),
      monthlyCredits: v.optional(v.number()),
      rolloverCredits: v.optional(v.boolean()),
      maxRolloverCredits: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      apiRateLimit: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { planId, updates }) => {
    // TODO: Add admin authentication check
    
    await ctx.db.patch(planId, updates);
    return { success: true };
  },
});

// ========== USER SUBSCRIPTIONS ==========

/**
 * Get user's current subscription
 */
export const getCurrentSubscription = query({
  args: { memberId: v.id("convexMembers") },
  handler: async (ctx, { memberId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("byMemberId", (q) => 
        q.eq("memberId", memberId).eq("status", "active")
      )
      .first();
    
    if (!subscription) return null;
    
    const plan = await ctx.db.get(subscription.planId);
    
    return {
      ...subscription,
      plan,
    };
  },
});

/**
 * Create a new subscription for a user
 */
export const createSubscription = mutation({
  args: {
    memberId: v.id("convexMembers"),
    planId: v.id("subscriptionPlans"),
    billingPeriod: v.union(v.literal("monthly"), v.literal("yearly")),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    trialDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    
    const now = Date.now();
    const periodEnd = now + (args.billingPeriod === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000;
    
    let trialStart, trialEnd;
    if (args.trialDays) {
      trialStart = now;
      trialEnd = now + args.trialDays * 24 * 60 * 60 * 1000;
    }
    
    // Cancel any existing active subscriptions
    const existingSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("byMemberId", (q) => 
        q.eq("memberId", args.memberId).eq("status", "active")
      )
      .collect();
    
    for (const sub of existingSubscriptions) {
      await ctx.db.patch(sub._id, { 
        status: "cancelled",
        updatedAt: now,
      });
    }
    
    // Create new subscription
    const subscriptionId = await ctx.db.insert("subscriptions", {
      memberId: args.memberId,
      planId: args.planId,
      status: trialStart ? "trialing" : "active",
      billingPeriod: args.billingPeriod,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      trialStart,
      trialEnd,
      createdAt: now,
      updatedAt: now,
    });
    
    // Allocate initial credits
    await ctx.scheduler.runAfter(0, internal.billing.allocateMonthlyCredits, {
      memberId: args.memberId,
      subscriptionId,
    });
    
    return subscriptionId;
  },
});

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("paused"),
    ),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: args.status,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Cancel subscription
 */
export const cancelSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    immediate: v.boolean(),
  },
  handler: async (ctx, { subscriptionId, immediate }) => {
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) throw new Error("Subscription not found");
    
    if (immediate) {
      await ctx.db.patch(subscriptionId, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(subscriptionId, {
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// ========== CREDIT MANAGEMENT ==========

/**
 * Get user's credit balance
 */
export const getCreditBalance = query({
  args: { memberId: v.id("convexMembers") },
  handler: async (ctx, { memberId }) => {
    const balance = await ctx.db
      .query("creditBalances")
      .withIndex("byMemberId", (q) => q.eq("memberId", memberId))
      .first();
    
    return balance || {
      balance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
    };
  },
});

/**
 * Get credit transaction history
 */
export const getCreditTransactions = query({
  args: {
    memberId: v.id("convexMembers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { memberId, limit = 50 }) => {
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("byMemberId", (q) => q.eq("memberId", memberId))
      .order("desc")
      .take(limit);
    
    return transactions;
  },
});

/**
 * Add credits to user's account
 */
export const addCredits = mutation({
  args: {
    memberId: v.id("convexMembers"),
    amount: v.number(),
    type: v.union(
      v.literal("purchase"),
      v.literal("monthly_allocation"),
      v.literal("bonus"),
      v.literal("refund"),
    ),
    description: v.string(),
    subscriptionId: v.optional(v.id("subscriptions")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { memberId, amount, type, description } = args;
    
    // Get or create credit balance
    let balance = await ctx.db
      .query("creditBalances")
      .withIndex("byMemberId", (q) => q.eq("memberId", memberId))
      .first();
    
    const now = Date.now();
    
    if (!balance) {
      const balanceId = await ctx.db.insert("creditBalances", {
        memberId,
        balance: amount,
        lifetimeEarned: amount,
        lifetimeSpent: 0,
        lastResetAt: now,
        updatedAt: now,
      });
      
      balance = (await ctx.db.get(balanceId))!;
    } else {
      await ctx.db.patch(balance._id, {
        balance: balance.balance + amount,
        lifetimeEarned: balance.lifetimeEarned + amount,
        updatedAt: now,
      });
      
      balance = (await ctx.db.get(balance._id))!;
    }
    
    // Record transaction
    await ctx.db.insert("creditTransactions", {
      memberId,
      amount,
      balanceAfter: balance.balance,
      type,
      description,
      subscriptionId: args.subscriptionId,
      metadata: args.metadata,
      createdAt: now,
    });
    
    return {
      success: true,
      newBalance: balance.balance,
    };
  },
});

/**
 * Deduct credits for usage
 */
export const deductCredits = mutation({
  args: {
    memberId: v.id("convexMembers"),
    amount: v.number(),
    description: v.string(),
    chatId: v.optional(v.id("chats")),
    usageRecordId: v.optional(v.id("usageRecords")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query("creditBalances")
      .withIndex("byMemberId", (q) => q.eq("memberId", args.memberId))
      .first();
    
    if (!balance || balance.balance < args.amount) {
      throw new Error("Insufficient credits");
    }
    
    const now = Date.now();
    const newBalance = balance.balance - args.amount;
    
    await ctx.db.patch(balance._id, {
      balance: newBalance,
      lifetimeSpent: balance.lifetimeSpent + args.amount,
      updatedAt: now,
    });
    
    // Record transaction
    await ctx.db.insert("creditTransactions", {
      memberId: args.memberId,
      amount: -args.amount,
      balanceAfter: newBalance,
      type: "usage_deduction",
      description: args.description,
      chatId: args.chatId,
      usageRecordId: args.usageRecordId,
      metadata: args.metadata,
      createdAt: now,
    });
    
    return {
      success: true,
      newBalance,
    };
  },
});

/**
 * Internal function to allocate monthly credits
 */
export const allocateMonthlyCredits = internalMutation({
  args: {
    memberId: v.id("convexMembers"),
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, { memberId, subscriptionId }) => {
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) return;
    
    const plan = await ctx.db.get(subscription.planId);
    if (!plan) return;
    
    // Check for rollover
    let creditsToAdd = plan.monthlyCredits;
    const balance = await ctx.db
      .query("creditBalances")
      .withIndex("byMemberId", (q) => q.eq("memberId", memberId))
      .first();
    
    if (plan.rolloverCredits && balance && balance.balance > 0) {
      const maxRollover = plan.maxRolloverCredits || plan.monthlyCredits;
      const rolloverAmount = Math.min(balance.balance, maxRollover);
      creditsToAdd += rolloverAmount;
    }
    
    // Add credits
    await ctx.runMutation(internal.billing.addCredits, {
      memberId,
      amount: creditsToAdd,
      type: "monthly_allocation",
      description: `Monthly credit allocation for ${plan.displayName} plan`,
      subscriptionId,
    });
  },
});

// ========== USAGE TRACKING ==========

/**
 * Record usage and deduct credits
 */
export const recordUsage = mutation({
  args: {
    memberId: v.id("convexMembers"),
    chatId: v.optional(v.id("chats")),
    resourceType: v.union(
      v.literal("llm_tokens"),
      v.literal("api_call"),
      v.literal("storage"),
      v.literal("deployment"),
      v.literal("data_source_query"),
    ),
    quantity: v.number(),
    creditCost: v.number(),
    modelId: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    cachedPromptTokens: v.optional(v.number()),
    apiIntegrationId: v.optional(v.id("apiIntegrations")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create usage record
    const usageRecordId = await ctx.db.insert("usageRecords", {
      memberId: args.memberId,
      chatId: args.chatId,
      resourceType: args.resourceType,
      quantity: args.quantity,
      creditCost: args.creditCost,
      modelId: args.modelId,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      cachedPromptTokens: args.cachedPromptTokens,
      apiIntegrationId: args.apiIntegrationId,
      metadata: args.metadata,
      timestamp: now,
    });
    
    // Deduct credits
    try {
      await ctx.runMutation(internal.billing.deductCredits, {
        memberId: args.memberId,
        amount: args.creditCost,
        description: `${args.resourceType} usage`,
        chatId: args.chatId,
        usageRecordId,
        metadata: args.metadata,
      });
    } catch (error) {
      // If credit deduction fails, mark the usage record
      await ctx.db.patch(usageRecordId, {
        metadata: {
          ...args.metadata,
          creditDeductionFailed: true,
          error: String(error),
        },
      });
      throw error;
    }
    
    return {
      success: true,
      usageRecordId,
    };
  },
});

/**
 * Get usage statistics for a member
 */
export const getUsageStats = query({
  args: {
    memberId: v.id("convexMembers"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { memberId, startDate, endDate }) => {
    const start = startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // Last 30 days
    const end = endDate || Date.now();
    
    const usageRecords = await ctx.db
      .query("usageRecords")
      .withIndex("byMemberId", (q) => q.eq("memberId", memberId))
      .filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), start),
          q.lte(q.field("timestamp"), end)
        )
      )
      .collect();
    
    // Aggregate by resource type
    const stats = usageRecords.reduce((acc, record) => {
      const type = record.resourceType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalQuantity: 0,
          totalCreditCost: 0,
        };
      }
      acc[type].count++;
      acc[type].totalQuantity += record.quantity;
      acc[type].totalCreditCost += record.creditCost;
      return acc;
    }, {} as Record<string, any>);
    
    const totalCreditsSpent = usageRecords.reduce(
      (sum, record) => sum + record.creditCost, 
      0
    );
    
    return {
      stats,
      totalCreditsSpent,
      totalRecords: usageRecords.length,
      startDate: start,
      endDate: end,
    };
  },
});

// ========== WEBHOOKS & STRIPE INTEGRATION ==========

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = mutation({
  args: {
    event: v.any(),
  },
  handler: async (ctx, { event }) => {
    // TODO: Verify webhook signature
    
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(ctx, event.data.object);
        break;
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(ctx, event.data.object);
        break;
      
      case "invoice.paid":
        await handleInvoicePaid(ctx, event.data.object);
        break;
      
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(ctx, event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return { success: true };
  },
});

async function handleSubscriptionUpdate(ctx: any, stripeSubscription: any) {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("byStripeSubscriptionId", (q) => 
      q.eq("stripeSubscriptionId", stripeSubscription.id)
    )
    .first();
  
  if (subscription) {
    await ctx.db.patch(subscription._id, {
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start * 1000,
      currentPeriodEnd: stripeSubscription.current_period_end * 1000,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      updatedAt: Date.now(),
    });
  }
}

async function handleSubscriptionDeleted(ctx: any, stripeSubscription: any) {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("byStripeSubscriptionId", (q) => 
      q.eq("stripeSubscriptionId", stripeSubscription.id)
    )
    .first();
  
  if (subscription) {
    await ctx.db.patch(subscription._id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  }
}

async function handleInvoicePaid(ctx: any, invoice: any) {
  // Create payment record
  const memberId = await getMemberIdFromStripeCustomer(ctx, invoice.customer);
  if (!memberId) return;
  
  await ctx.db.insert("payments", {
    memberId,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    paymentMethod: "card",
    stripePaymentIntentId: invoice.payment_intent,
    stripeChargeId: invoice.charge,
    description: invoice.description || "Subscription payment",
    createdAt: Date.now(),
  });
}

async function handleInvoicePaymentFailed(ctx: any, invoice: any) {
  const memberId = await getMemberIdFromStripeCustomer(ctx, invoice.customer);
  if (!memberId) return;
  
  // Update subscription status
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("byMemberId", (q) => 
      q.eq("memberId", memberId).eq("status", "active")
    )
    .first();
  
  if (subscription) {
    await ctx.db.patch(subscription._id, {
      status: "past_due",
      updatedAt: Date.now(),
    });
  }
}

async function getMemberIdFromStripeCustomer(ctx: any, stripeCustomerId: string) {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("byMemberId")
    .filter((q) => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
    .first();
  
  return subscription?.memberId;
}
