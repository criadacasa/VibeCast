import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import type { Infer, Validator } from "convex/values";
import type { CoreMessage } from "ai";

export const apiKeyValidator = v.object({
  preference: v.union(v.literal("always"), v.literal("quotaExhausted")),
  // NB: This is the *Anthropic* API key.
  value: v.optional(v.string()),
  openai: v.optional(v.string()),
  xai: v.optional(v.string()),
  google: v.optional(v.string()),
});

// A stable-enough way to store token usage.
export const usageRecordValidator = v.object({
  completionTokens: v.number(),
  promptTokens: v.number(),
  /** Included in promptTokens total! */
  cachedPromptTokens: v.number(),
});

export type UsageRecord = Infer<typeof usageRecordValidator>;

export default defineSchema({
  /*
   * We create a session (if it does not exist) and store the ID in local storage.
   * We only show chats for the current session, so we rely on the session ID being
   * unguessable (i.e. we should never list session IDs or return them in function
   * results).
   */
  sessions: defineTable({
    // When auth-ing with convex.dev, we'll save a `convexMembers` document and
    // reference it here.
    memberId: v.optional(v.id("convexMembers")),
  }).index("byMemberId", ["memberId"]),

  convexMembers: defineTable({
    tokenIdentifier: v.string(),
    apiKey: v.optional(apiKeyValidator),
    convexMemberId: v.optional(v.string()),
    softDeletedForWorkOSMerge: v.optional(v.boolean()),
    // Not authoritative, just a cache of the user's profile from WorkOS/provision host.
    cachedProfile: v.optional(
      v.object({
        username: v.string(),
        avatar: v.string(),
        email: v.string(),
        id: v.string(),
      }),
    ),
  })
    .index("byTokenIdentifier", ["tokenIdentifier"])
    .index("byConvexMemberId", ["convexMemberId", "softDeletedForWorkOSMerge"]),

  /*
   * Admin status means being on the convex team on the provision host.
   * It doesn't work when using a local big brain (provision host).
   */
  convexAdmins: defineTable({
    convexMemberId: v.id("convexMembers"), // should be unique
    lastCheckedForAdminStatus: v.number(),
    wasAdmin: v.boolean(),
  }).index("byConvexMemberId", ["convexMemberId"]),

  /*
   * All chats have two IDs -- an `initialId` that is always set (UUID) and a `urlId`
   * that is more human friendly (e.g. "tic-tac-toe").
   * The `urlId` is set based on the LLM messages so is initially unset.
   * Both `initialId` and `urlId` should be unique within the creatorId, all functions
   * should accept either `initialId` or `urlId`, and when returning an identifier,
   * we should prefer `urlId` if it is set.
   */
  chats: defineTable({
    creatorId: v.id("sessions"),
    initialId: v.string(),
    urlId: v.optional(v.string()),
    description: v.optional(v.string()),
    timestamp: v.string(),
    metadata: v.optional(v.any()), // TODO migration to remove this column
    snapshotId: v.optional(v.id("_storage")),
    lastMessageRank: v.optional(v.number()),
    lastSubchatIndex: v.number(),
    hasBeenDeployed: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    convexProject: v.optional(
      v.union(
        v.object({
          kind: v.literal("connected"),
          projectSlug: v.string(),
          teamSlug: v.string(),
          // for this member's dev deployment
          deploymentUrl: v.string(),
          deploymentName: v.string(),
          warningMessage: v.optional(v.string()),
        }),
        v.object({
          kind: v.literal("connecting"),
          checkConnectionJobId: v.optional(v.id("_scheduled_functions")),
        }),
        v.object({
          kind: v.literal("failed"),
          errorMessage: v.string(),
        }),
      ),
    ),
  })
    .index("byCreatorAndId", ["creatorId", "initialId", "isDeleted"])
    .index("byCreatorAndUrlId", ["creatorId", "urlId", "isDeleted"])
    .index("bySnapshotId", ["snapshotId"])
    .index("byInitialId", ["initialId", "isDeleted"]),

  convexProjectCredentials: defineTable({
    projectSlug: v.string(),
    teamSlug: v.string(),
    memberId: v.optional(v.id("convexMembers")),
    projectDeployKey: v.string(),
  }).index("bySlugs", ["teamSlug", "projectSlug"]),
  chatMessagesStorageState: defineTable({
    chatId: v.id("chats"),
    storageId: v.union(v.id("_storage"), v.null()),
    subchatIndex: v.number(),
    lastMessageRank: v.number(),
    description: v.optional(v.string()),
    partIndex: v.number(),
    snapshotId: v.optional(v.id("_storage")),
  })
    .index("byChatId", ["chatId", "subchatIndex", "lastMessageRank", "partIndex"])
    .index("byStorageId", ["storageId"])
    .index("bySnapshotId", ["snapshotId"]),

  // This type of share is for forking from a specific point in time.
  // Call it a debugging snapshot or a fork point. There can be multiple per chat.
  // The main thing they are used for is forking a project at a set point
  // into another user's account.
  shares: defineTable({
    chatId: v.id("chats"),
    snapshotId: v.id("_storage"),
    code: v.string(),

    chatHistoryId: v.union(v.id("_storage"), v.null()),

    // Keeps track of the lastMessageRank, partIndex, and subchatIndex of the chat at the time the share was created.
    // These fields aren't used but they are useful hints for how big the chat is and where the snapshot came from.
    lastMessageRank: v.number(),
    lastSubchatIndex: v.number(),
    partIndex: v.optional(v.number()),
    // The description of the chat at the time the share was created.
    description: v.optional(v.string()),
  })
    .index("byCode", ["code"])
    .index("bySnapshotId", ["snapshotId"])
    .index("byChatHistoryId", ["chatHistoryId"])
    .index("byChatIdAndLastSubchatIndex", ["chatId", "lastSubchatIndex"]),

  // This type of share is for sharing a "project."
  // You only get one for a given project for now.
  socialShares: defineTable({
    chatId: v.id("chats"),
    code: v.string(),
    thumbnailImageStorageId: v.optional(v.id("_storage")),
    // Does the share link work. Three states so we can immediately share on opening the share dialog.
    shared: v.union(v.literal("shared"), v.literal("expresslyUnshared"), v.literal("noPreferenceExpressed")),
    // Allow others to fork this project at its most recent state. Always true for now.
    allowForkFromLatest: v.boolean(),
    // Allow to be shown in gallery (doesn't mean we actual show it).
    // Always false for now, this doesn't exist yet.
    allowShowInGallery: v.boolean(),
    // Link to the deployed version from the share card. Always true for now.
    linkToDeployed: v.boolean(),
    // Optional referral code for Convex signup bonus
    referralCode: v.optional(v.union(v.string(), v.null())),
  })
    .index("byCode", ["code"])
    .index("byChatId", ["chatId"])
    .index("byAllowShowInGallery", ["allowShowInGallery"])
    .index("byThumbnailImageStorageId", ["thumbnailImageStorageId"]),

  memberOpenAITokens: defineTable({
    memberId: v.id("convexMembers"),
    token: v.string(),
    requestsRemaining: v.number(),
    lastUsedTime: v.union(v.number(), v.null()),
  })
    .index("byMemberId", ["memberId"])
    .index("byToken", ["token"]),

  resendTokens: defineTable({
    memberId: v.id("convexMembers"),
    token: v.string(),
    verifiedEmail: v.string(),
    requestsRemaining: v.number(),
    lastUsedTime: v.union(v.number(), v.null()),
  })
    .index("byMemberId", ["memberId"])
    .index("byToken", ["token"]),

  /*
   * The entire prompt sent to a LLM and the response we received.
   * Associated with an initialChatId but does not reset on rewind
   * and is not duplicated in a "share" (fork) to a new account.
   * This is roughly equivalent to what Braintrust logs would provide.
   * https://www.braintrust.dev/docs/guides/logs
   *
   * This is not designed to be load-bearing data, it is just for debugging.
   * Do not use this table to power non-debug UI or make agent decisions,
   * it may be missing or incomplete for any given chat.
   */
  debugChatApiRequestLog: defineTable({
    chatId: v.id("chats"),
    subchatIndex: v.optional(v.number()),
    // Such a loose type doesn't feel so bad since this is debugging data, but if we try
    // to display older versions of this we need to make any fields added to CoreMessage in
    // later versions of the Vercel AI SDK optional on the read path.
    responseCoreMessages: v.array(v.any() as Validator<CoreMessage, "required", any>),
    promptCoreMessagesStorageId: v.id("_storage"),
    finishReason: v.string(),
    modelId: v.string(),

    // Not necessarily the usage we billed because
    // - personal API key use shows up here too
    // - failed tool calls count here but we try not to bill for those
    // - usage code uses the provider for the final generation to bill for all LLM calls in the same interation
    //   but this debug info uses the correct provider for each call
    usage: usageRecordValidator,
    chefTokens: v.number(),
  })
    .index("byChatId", ["chatId"])
    .index("byStorageId", ["promptCoreMessagesStorageId"]),
  // Inspired by the migrations component, but for our migrations that we don't use the component for.
  migrations: defineTable({
    name: v.string(),
    forReal: v.boolean(),
    cursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
    // The number of documents processed so far.
    processed: v.number(),
    numDeleted: v.number(),
    latestEnd: v.optional(v.number()),
  })
    .index("name", ["name"])
    .index("isDone", ["isDone"]),

  // ========== SaaS BILLING & SUBSCRIPTION SYSTEM ==========
  
  /*
   * Subscription plans available in the platform
   */
  subscriptionPlans: defineTable({
    name: v.string(), // e.g., "Free", "Starter", "Pro", "Enterprise"
    displayName: v.string(),
    description: v.string(),
    isActive: v.boolean(),
    // Pricing
    monthlyPrice: v.number(), // in cents
    yearlyPrice: v.optional(v.number()), // in cents, with discount
    currency: v.string(), // e.g., "USD"
    // Stripe configuration
    stripePriceIdMonthly: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
    // Credits & limits
    monthlyCredits: v.number(), // credits allocated per month
    rolloverCredits: v.boolean(), // whether unused credits carry over
    maxRolloverCredits: v.optional(v.number()),
    // Feature limits
    maxProjects: v.union(v.number(), v.literal("unlimited")),
    maxApiIntegrations: v.union(v.number(), v.literal("unlimited")),
    maxTeamMembers: v.union(v.number(), v.literal("unlimited")),
    maxDeployments: v.union(v.number(), v.literal("unlimited")),
    // Features access
    features: v.array(v.string()), // e.g., ["custom_domain", "priority_support", "advanced_analytics"]
    // API rate limits per minute
    apiRateLimit: v.number(),
    sortOrder: v.number(),
  })
    .index("byName", ["name"])
    .index("byIsActive", ["isActive", "sortOrder"]),

  /*
   * User subscriptions
   */
  subscriptions: defineTable({
    memberId: v.id("convexMembers"),
    planId: v.id("subscriptionPlans"),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("paused"),
    ),
    // Billing period
    billingPeriod: v.union(v.literal("monthly"), v.literal("yearly")),
    currentPeriodStart: v.number(), // timestamp
    currentPeriodEnd: v.number(), // timestamp
    cancelAtPeriodEnd: v.boolean(),
    // Stripe data
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    // Trial
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byMemberId", ["memberId", "status"])
    .index("byStripeSubscriptionId", ["stripeSubscriptionId"])
    .index("byStatus", ["status", "currentPeriodEnd"]),

  /*
   * Credit balances for users
   */
  creditBalances: defineTable({
    memberId: v.id("convexMembers"),
    balance: v.number(), // current credit balance
    lifetimeEarned: v.number(), // total credits ever earned
    lifetimeSpent: v.number(), // total credits ever spent
    lastResetAt: v.number(), // last time monthly credits were added
    updatedAt: v.number(),
  }).index("byMemberId", ["memberId"]),

  /*
   * Credit transaction history
   */
  creditTransactions: defineTable({
    memberId: v.id("convexMembers"),
    amount: v.number(), // positive for credit, negative for debit
    balanceAfter: v.number(),
    type: v.union(
      v.literal("purchase"),
      v.literal("monthly_allocation"),
      v.literal("bonus"),
      v.literal("refund"),
      v.literal("usage_deduction"),
      v.literal("rollover"),
    ),
    description: v.string(),
    // Related entities
    subscriptionId: v.optional(v.id("subscriptions")),
    chatId: v.optional(v.id("chats")),
    usageRecordId: v.optional(v.id("usageRecords")),
    // Metadata
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("byMemberId", ["memberId", "createdAt"])
    .index("byType", ["type", "createdAt"]),

  /*
   * Detailed usage tracking for billing
   */
  usageRecords: defineTable({
    memberId: v.id("convexMembers"),
    chatId: v.optional(v.id("chats")),
    // Usage type
    resourceType: v.union(
      v.literal("llm_tokens"),
      v.literal("api_call"),
      v.literal("storage"),
      v.literal("deployment"),
      v.literal("data_source_query"),
    ),
    // Quantification
    quantity: v.number(), // e.g., token count, API calls
    creditCost: v.number(), // credits deducted
    // LLM specific
    modelId: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    cachedPromptTokens: v.optional(v.number()),
    // API integration specific
    apiIntegrationId: v.optional(v.id("apiIntegrations")),
    // Metadata
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("byMemberId", ["memberId", "timestamp"])
    .index("byChatId", ["chatId", "timestamp"])
    .index("byResourceType", ["resourceType", "timestamp"])
    .index("byApiIntegration", ["apiIntegrationId", "timestamp"]),

  // ========== NATIVE API INTEGRATIONS ==========

  /*
   * API Integration definitions - these are the data source connectors
   */
  apiIntegrations: defineTable({
    memberId: v.id("convexMembers"),
    name: v.string(), // user-friendly name
    provider: v.union(
      v.literal("rest_api"),
      v.literal("graphql"),
      v.literal("postgres"),
      v.literal("mysql"),
      v.literal("mongodb"),
      v.literal("airtable"),
      v.literal("google_sheets"),
      v.literal("stripe"),
      v.literal("salesforce"),
      v.literal("hubspot"),
      v.literal("shopify"),
      v.literal("firebase"),
      v.literal("supabase"),
      v.literal("custom"),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("error"),
      v.literal("testing"),
    ),
    // Connection configuration (encrypted in production)
    config: v.object({
      // For REST/GraphQL APIs
      baseUrl: v.optional(v.string()),
      authType: v.optional(
        v.union(
          v.literal("none"),
          v.literal("api_key"),
          v.literal("bearer_token"),
          v.literal("oauth2"),
          v.literal("basic_auth"),
        ),
      ),
      apiKey: v.optional(v.string()),
      apiKeyHeader: v.optional(v.string()),
      bearerToken: v.optional(v.string()),
      basicAuthUsername: v.optional(v.string()),
      basicAuthPassword: v.optional(v.string()),
      oauth2AccessToken: v.optional(v.string()),
      oauth2RefreshToken: v.optional(v.string()),
      oauth2TokenExpiry: v.optional(v.number()),
      // For databases
      host: v.optional(v.string()),
      port: v.optional(v.number()),
      database: v.optional(v.string()),
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      connectionString: v.optional(v.string()),
      // Common settings
      headers: v.optional(v.any()), // custom headers as object
      timeout: v.optional(v.number()),
      retryAttempts: v.optional(v.number()),
    }),
    // Schema information (cached from data source)
    schema: v.optional(
      v.object({
        tables: v.optional(v.array(v.any())),
        endpoints: v.optional(v.array(v.any())),
        types: v.optional(v.any()),
        lastUpdated: v.number(),
      }),
    ),
    // Usage tracking
    totalRequests: v.number(),
    failedRequests: v.number(),
    lastUsedAt: v.optional(v.number()),
    lastErrorAt: v.optional(v.number()),
    lastErrorMessage: v.optional(v.string()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byMemberId", ["memberId", "status"])
    .index("byProvider", ["provider", "status"]),

  /*
   * Saved queries/operations for API integrations
   */
  apiQueries: defineTable({
    memberId: v.id("convexMembers"),
    integrationId: v.id("apiIntegrations"),
    name: v.string(),
    description: v.optional(v.string()),
    // Query definition
    queryType: v.union(
      v.literal("rest_get"),
      v.literal("rest_post"),
      v.literal("rest_put"),
      v.literal("rest_delete"),
      v.literal("graphql_query"),
      v.literal("graphql_mutation"),
      v.literal("sql_select"),
      v.literal("sql_insert"),
      v.literal("sql_update"),
      v.literal("sql_delete"),
    ),
    endpoint: v.optional(v.string()), // for REST
    query: v.optional(v.string()), // SQL or GraphQL query
    variables: v.optional(v.any()), // query parameters/variables
    requestBody: v.optional(v.any()),
    // Caching
    cacheEnabled: v.boolean(),
    cacheTTL: v.optional(v.number()), // in seconds
    // Metadata
    usageCount: v.number(),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byIntegration", ["integrationId", "name"])
    .index("byMemberId", ["memberId"]),

  /*
   * Webhook configurations for real-time data updates
   */
  webhooks: defineTable({
    memberId: v.id("convexMembers"),
    integrationId: v.optional(v.id("apiIntegrations")),
    name: v.string(),
    url: v.string(), // external webhook URL to call
    events: v.array(v.string()), // events that trigger this webhook
    isActive: v.boolean(),
    secret: v.optional(v.string()), // for webhook signature verification
    headers: v.optional(v.any()),
    retryPolicy: v.object({
      maxRetries: v.number(),
      retryDelayMs: v.number(),
    }),
    // Stats
    totalCalls: v.number(),
    failedCalls: v.number(),
    lastCalledAt: v.optional(v.number()),
    lastFailureAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byMemberId", ["memberId", "isActive"])
    .index("byIntegration", ["integrationId"]),

  // ========== BILLING & PAYMENT RECORDS ==========

  /*
   * Payment transactions
   */
  payments: defineTable({
    memberId: v.id("convexMembers"),
    subscriptionId: v.optional(v.id("subscriptions")),
    amount: v.number(), // in cents
    currency: v.string(),
    status: v.union(
      v.literal("succeeded"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    paymentMethod: v.union(
      v.literal("card"),
      v.literal("bank_transfer"),
      v.literal("paypal"),
      v.literal("other"),
    ),
    // Stripe
    stripePaymentIntentId: v.optional(v.string()),
    stripeChargeId: v.optional(v.string()),
    // Metadata
    description: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("byMemberId", ["memberId", "createdAt"])
    .index("byStripePaymentIntentId", ["stripePaymentIntentId"])
    .index("byStatus", ["status", "createdAt"]),

  /*
   * Invoices
   */
  invoices: defineTable({
    memberId: v.id("convexMembers"),
    subscriptionId: v.optional(v.id("subscriptions")),
    invoiceNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("paid"),
      v.literal("void"),
      v.literal("uncollectible"),
    ),
    // Amounts
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    amountPaid: v.number(),
    amountDue: v.number(),
    currency: v.string(),
    // Line items
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitAmount: v.number(),
        amount: v.number(),
      }),
    ),
    // Dates
    periodStart: v.number(),
    periodEnd: v.number(),
    dueDate: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    // Stripe
    stripeInvoiceId: v.optional(v.string()),
    stripeInvoiceUrl: v.optional(v.string()),
    stripeInvoicePdf: v.optional(v.string()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byMemberId", ["memberId", "createdAt"])
    .index("byStripeInvoiceId", ["stripeInvoiceId"])
    .index("byStatus", ["status", "createdAt"])
    .index("byInvoiceNumber", ["invoiceNumber"]),

  // ========== ANALYTICS & REPORTING ==========

  /*
   * Daily usage aggregations for analytics
   */
  dailyUsageStats: defineTable({
    memberId: v.id("convexMembers"),
    date: v.string(), // YYYY-MM-DD format
    // Aggregated metrics
    totalCreditsSpent: v.number(),
    totalApiCalls: v.number(),
    totalTokens: v.number(),
    totalPromptTokens: v.number(),
    totalCompletionTokens: v.number(),
    // By resource type
    usageByResource: v.any(), // map of resourceType -> count
    // By integration
    usageByIntegration: v.any(), // map of integrationId -> count
    // Project count
    activeProjects: v.number(),
    createdAt: v.number(),
  })
    .index("byMemberId", ["memberId", "date"])
    .index("byDate", ["date"]),
});
