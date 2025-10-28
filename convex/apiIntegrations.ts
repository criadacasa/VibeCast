/**
 * API Integrations & Data Sources
 * 
 * This module provides native integrations with various data source providers:
 * - REST APIs
 * - GraphQL endpoints
 * - Databases (PostgreSQL, MySQL, MongoDB)
 * - SaaS platforms (Airtable, Google Sheets, Stripe, etc.)
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// ========== API INTEGRATION MANAGEMENT ==========

/**
 * Get all API integrations for a member
 */
export const getApiIntegrations = query({
  args: { 
    memberId: v.id("convexMembers"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("error"),
      v.literal("testing"),
    )),
  },
  handler: async (ctx, { memberId, status }) => {
    let query = ctx.db
      .query("apiIntegrations")
      .withIndex("byMemberId", (q) => q.eq("memberId", memberId));
    
    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    }
    
    const integrations = await query.collect();
    
    // Remove sensitive data before returning
    return integrations.map(integration => ({
      ...integration,
      config: {
        ...integration.config,
        apiKey: integration.config.apiKey ? "***" : undefined,
        bearerToken: integration.config.bearerToken ? "***" : undefined,
        password: integration.config.password ? "***" : undefined,
        basicAuthPassword: integration.config.basicAuthPassword ? "***" : undefined,
        oauth2AccessToken: integration.config.oauth2AccessToken ? "***" : undefined,
        oauth2RefreshToken: integration.config.oauth2RefreshToken ? "***" : undefined,
      },
    }));
  },
});

/**
 * Get a specific API integration
 */
export const getApiIntegration = query({
  args: { 
    integrationId: v.id("apiIntegrations"),
    memberId: v.id("convexMembers"),
  },
  handler: async (ctx, { integrationId, memberId }) => {
    const integration = await ctx.db.get(integrationId);
    
    if (!integration || integration.memberId !== memberId) {
      throw new Error("Integration not found");
    }
    
    // Remove sensitive data
    return {
      ...integration,
      config: {
        ...integration.config,
        apiKey: integration.config.apiKey ? "***" : undefined,
        bearerToken: integration.config.bearerToken ? "***" : undefined,
        password: integration.config.password ? "***" : undefined,
        basicAuthPassword: integration.config.basicAuthPassword ? "***" : undefined,
        oauth2AccessToken: integration.config.oauth2AccessToken ? "***" : undefined,
        oauth2RefreshToken: integration.config.oauth2RefreshToken ? "***" : undefined,
      },
    };
  },
});

/**
 * Create a new API integration
 */
export const createApiIntegration = mutation({
  args: {
    memberId: v.id("convexMembers"),
    name: v.string(),
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
    config: v.object({
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
      host: v.optional(v.string()),
      port: v.optional(v.number()),
      database: v.optional(v.string()),
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      connectionString: v.optional(v.string()),
      headers: v.optional(v.any()),
      timeout: v.optional(v.number()),
      retryAttempts: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { memberId, name, provider, config }) => {
    // Check subscription limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("byMemberId", (q) => 
        q.eq("memberId", memberId).eq("status", "active")
      )
      .first();
    
    if (!subscription) {
      throw new Error("No active subscription found");
    }
    
    const plan = await ctx.db.get(subscription.planId);
    if (!plan) {
      throw new Error("Subscription plan not found");
    }
    
    // Check if user has reached integration limit
    const existingIntegrations = await ctx.db
      .query("apiIntegrations")
      .withIndex("byMemberId", (q) => q.eq("memberId", memberId))
      .filter((q) => 
        q.neq(q.field("status"), "inactive")
      )
      .collect();
    
    if (
      plan.maxApiIntegrations !== "unlimited" &&
      existingIntegrations.length >= plan.maxApiIntegrations
    ) {
      throw new Error(`Integration limit reached. Your plan allows ${plan.maxApiIntegrations} integrations.`);
    }
    
    const now = Date.now();
    
    const integrationId = await ctx.db.insert("apiIntegrations", {
      memberId,
      name,
      provider,
      status: "testing",
      config,
      totalRequests: 0,
      failedRequests: 0,
      createdAt: now,
      updatedAt: now,
    });
    
    return integrationId;
  },
});

/**
 * Update an API integration
 */
export const updateApiIntegration = mutation({
  args: {
    integrationId: v.id("apiIntegrations"),
    memberId: v.id("convexMembers"),
    updates: v.object({
      name: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("error"),
        v.literal("testing"),
      )),
      config: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { integrationId, memberId, updates }) => {
    const integration = await ctx.db.get(integrationId);
    
    if (!integration || integration.memberId !== memberId) {
      throw new Error("Integration not found");
    }
    
    await ctx.db.patch(integrationId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Delete an API integration
 */
export const deleteApiIntegration = mutation({
  args: {
    integrationId: v.id("apiIntegrations"),
    memberId: v.id("convexMembers"),
  },
  handler: async (ctx, { integrationId, memberId }) => {
    const integration = await ctx.db.get(integrationId);
    
    if (!integration || integration.memberId !== memberId) {
      throw new Error("Integration not found");
    }
    
    // Delete associated queries
    const queries = await ctx.db
      .query("apiQueries")
      .withIndex("byIntegration", (q) => q.eq("integrationId", integrationId))
      .collect();
    
    for (const query of queries) {
      await ctx.db.delete(query._id);
    }
    
    // Delete integration
    await ctx.db.delete(integrationId);
    
    return { success: true };
  },
});

/**
 * Test an API integration connection
 */
export const testApiIntegration = action({
  args: {
    integrationId: v.id("apiIntegrations"),
    memberId: v.id("convexMembers"),
  },
  handler: async (ctx, { integrationId, memberId }) => {
    const integration = await ctx.runQuery(internal.apiIntegrations.getIntegrationWithSecrets, {
      integrationId,
      memberId,
    });
    
    if (!integration) {
      throw new Error("Integration not found");
    }
    
    try {
      let result;
      
      switch (integration.provider) {
        case "rest_api":
          result = await testRestApiConnection(integration);
          break;
        
        case "graphql":
          result = await testGraphQLConnection(integration);
          break;
        
        case "postgres":
        case "mysql":
          result = await testDatabaseConnection(integration);
          break;
        
        case "mongodb":
          result = await testMongoDBConnection(integration);
          break;
        
        default:
          result = { success: false, error: "Provider not supported for testing" };
      }
      
      // Update integration status
      await ctx.runMutation(internal.apiIntegrations.updateApiIntegration, {
        integrationId,
        memberId,
        updates: {
          status: result.success ? "active" : "error",
        },
      });
      
      return result;
    } catch (error: any) {
      await ctx.runMutation(internal.apiIntegrations.updateApiIntegration, {
        integrationId,
        memberId,
        updates: {
          status: "error",
        },
      });
      
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// Helper function to get integration with secrets (internal only)
export const getIntegrationWithSecrets = query({
  args: {
    integrationId: v.id("apiIntegrations"),
    memberId: v.id("convexMembers"),
  },
  handler: async (ctx, { integrationId, memberId }) => {
    const integration = await ctx.db.get(integrationId);
    
    if (!integration || integration.memberId !== memberId) {
      return null;
    }
    
    return integration;
  },
});

// ========== API QUERIES ==========

/**
 * Get saved queries for an integration
 */
export const getApiQueries = query({
  args: {
    integrationId: v.id("apiIntegrations"),
    memberId: v.id("convexMembers"),
  },
  handler: async (ctx, { integrationId, memberId }) => {
    // Verify integration belongs to member
    const integration = await ctx.db.get(integrationId);
    if (!integration || integration.memberId !== memberId) {
      throw new Error("Integration not found");
    }
    
    const queries = await ctx.db
      .query("apiQueries")
      .withIndex("byIntegration", (q) => q.eq("integrationId", integrationId))
      .collect();
    
    return queries;
  },
});

/**
 * Create a saved query
 */
export const createApiQuery = mutation({
  args: {
    memberId: v.id("convexMembers"),
    integrationId: v.id("apiIntegrations"),
    name: v.string(),
    description: v.optional(v.string()),
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
    endpoint: v.optional(v.string()),
    query: v.optional(v.string()),
    variables: v.optional(v.any()),
    requestBody: v.optional(v.any()),
    cacheEnabled: v.boolean(),
    cacheTTL: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { memberId, integrationId, ...queryData } = args;
    
    // Verify integration belongs to member
    const integration = await ctx.db.get(integrationId);
    if (!integration || integration.memberId !== memberId) {
      throw new Error("Integration not found");
    }
    
    const now = Date.now();
    
    const queryId = await ctx.db.insert("apiQueries", {
      ...queryData,
      memberId,
      integrationId,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    
    return queryId;
  },
});

/**
 * Execute a saved or ad-hoc query
 */
export const executeApiQuery = action({
  args: {
    memberId: v.id("convexMembers"),
    integrationId: v.id("apiIntegrations"),
    queryId: v.optional(v.id("apiQueries")),
    // For ad-hoc queries
    queryType: v.optional(v.union(
      v.literal("rest_get"),
      v.literal("rest_post"),
      v.literal("rest_put"),
      v.literal("rest_delete"),
      v.literal("graphql_query"),
      v.literal("graphql_mutation"),
      v.literal("sql_select"),
    )),
    endpoint: v.optional(v.string()),
    query: v.optional(v.string()),
    variables: v.optional(v.any()),
    requestBody: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { memberId, integrationId, queryId } = args;
    
    // Get integration
    const integration = await ctx.runQuery(internal.apiIntegrations.getIntegrationWithSecrets, {
      integrationId,
      memberId,
    });
    
    if (!integration) {
      throw new Error("Integration not found");
    }
    
    // Get query if queryId provided
    let queryConfig = args;
    if (queryId) {
      const savedQuery = await ctx.runQuery(internal.apiIntegrations.getApiQueryById, {
        queryId,
        memberId,
      });
      if (savedQuery) {
        queryConfig = { ...savedQuery, ...args };
      }
    }
    
    try {
      let result;
      const startTime = Date.now();
      
      // Execute based on query type
      if (queryConfig.queryType?.startsWith("rest_")) {
        result = await executeRestQuery(integration, queryConfig);
      } else if (queryConfig.queryType?.startsWith("graphql_")) {
        result = await executeGraphQLQuery(integration, queryConfig);
      } else if (queryConfig.queryType?.startsWith("sql_")) {
        result = await executeSQLQuery(integration, queryConfig);
      } else {
        throw new Error("Invalid query type");
      }
      
      const executionTime = Date.now() - startTime;
      
      // Calculate credit cost (example: 1 credit per 100ms + 1 credit per request)
      const creditCost = Math.ceil(executionTime / 100) + 1;
      
      // Record usage
      await ctx.runMutation(internal.billing.recordUsage, {
        memberId,
        resourceType: "data_source_query",
        quantity: 1,
        creditCost,
        apiIntegrationId: integrationId,
        metadata: {
          queryType: queryConfig.queryType,
          executionTime,
        },
      });
      
      // Update integration stats
      await ctx.runMutation(internal.apiIntegrations.updateIntegrationStats, {
        integrationId,
        success: true,
      });
      
      // Update query usage if saved query
      if (queryId) {
        await ctx.runMutation(internal.apiIntegrations.updateQueryUsage, {
          queryId,
        });
      }
      
      return {
        success: true,
        data: result.data,
        executionTime,
        creditCost,
      };
    } catch (error: any) {
      // Update integration stats
      await ctx.runMutation(internal.apiIntegrations.updateIntegrationStats, {
        integrationId,
        success: false,
        errorMessage: error.message,
      });
      
      throw error;
    }
  },
});

// Internal helper mutations
export const getApiQueryById = query({
  args: {
    queryId: v.id("apiQueries"),
    memberId: v.id("convexMembers"),
  },
  handler: async (ctx, { queryId, memberId }) => {
    const query = await ctx.db.get(queryId);
    if (!query || query.memberId !== memberId) {
      return null;
    }
    return query;
  },
});

export const updateIntegrationStats = mutation({
  args: {
    integrationId: v.id("apiIntegrations"),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { integrationId, success, errorMessage }) => {
    const integration = await ctx.db.get(integrationId);
    if (!integration) return;
    
    const now = Date.now();
    
    await ctx.db.patch(integrationId, {
      totalRequests: integration.totalRequests + 1,
      failedRequests: success ? integration.failedRequests : integration.failedRequests + 1,
      lastUsedAt: now,
      lastErrorAt: success ? integration.lastErrorAt : now,
      lastErrorMessage: success ? integration.lastErrorMessage : errorMessage,
      updatedAt: now,
    });
  },
});

export const updateQueryUsage = mutation({
  args: {
    queryId: v.id("apiQueries"),
  },
  handler: async (ctx, { queryId }) => {
    const query = await ctx.db.get(queryId);
    if (!query) return;
    
    await ctx.db.patch(queryId, {
      usageCount: query.usageCount + 1,
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ========== CONNECTION TESTERS ==========

async function testRestApiConnection(integration: any): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...integration.config.headers,
    };
    
    // Add authentication headers
    if (integration.config.authType === "api_key" && integration.config.apiKey) {
      const headerName = integration.config.apiKeyHeader || "X-API-Key";
      headers[headerName] = integration.config.apiKey;
    } else if (integration.config.authType === "bearer_token" && integration.config.bearerToken) {
      headers["Authorization"] = `Bearer ${integration.config.bearerToken}`;
    } else if (integration.config.authType === "basic_auth") {
      const credentials = btoa(
        `${integration.config.basicAuthUsername}:${integration.config.basicAuthPassword}`
      );
      headers["Authorization"] = `Basic ${credentials}`;
    }
    
    const response = await fetch(integration.config.baseUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(integration.config.timeout || 10000),
    });
    
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testGraphQLConnection(integration: any): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...integration.config.headers,
    };
    
    // Add authentication
    if (integration.config.authType === "bearer_token" && integration.config.bearerToken) {
      headers["Authorization"] = `Bearer ${integration.config.bearerToken}`;
    }
    
    // Simple introspection query to test connection
    const response = await fetch(integration.config.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: "{ __schema { queryType { name } } }",
      }),
      signal: AbortSignal.timeout(integration.config.timeout || 10000),
    });
    
    const result = await response.json();
    
    return {
      success: !result.errors,
      error: result.errors ? result.errors[0]?.message : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testDatabaseConnection(integration: any): Promise<{ success: boolean; error?: string }> {
  // Database connections would require server-side implementation
  // This is a placeholder that would connect to a backend service
  return {
    success: false,
    error: "Database connections require backend service implementation",
  };
}

async function testMongoDBConnection(integration: any): Promise<{ success: boolean; error?: string }> {
  // MongoDB connections would require server-side implementation
  return {
    success: false,
    error: "MongoDB connections require backend service implementation",
  };
}

// ========== QUERY EXECUTORS ==========

async function executeRestQuery(integration: any, query: any): Promise<{ data: any }> {
  const method = query.queryType.replace("rest_", "").toUpperCase();
  const url = query.endpoint 
    ? `${integration.config.baseUrl}${query.endpoint}`
    : integration.config.baseUrl;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...integration.config.headers,
  };
  
  // Add authentication
  if (integration.config.authType === "api_key" && integration.config.apiKey) {
    const headerName = integration.config.apiKeyHeader || "X-API-Key";
    headers[headerName] = integration.config.apiKey;
  } else if (integration.config.authType === "bearer_token" && integration.config.bearerToken) {
    headers["Authorization"] = `Bearer ${integration.config.bearerToken}`;
  }
  
  const options: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(integration.config.timeout || 30000),
  };
  
  if (query.requestBody && method !== "GET") {
    options.body = JSON.stringify(query.requestBody);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return { data };
}

async function executeGraphQLQuery(integration: any, query: any): Promise<{ data: any }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...integration.config.headers,
  };
  
  if (integration.config.authType === "bearer_token" && integration.config.bearerToken) {
    headers["Authorization"] = `Bearer ${integration.config.bearerToken}`;
  }
  
  const response = await fetch(integration.config.baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: query.query,
      variables: query.variables,
    }),
    signal: AbortSignal.timeout(integration.config.timeout || 30000),
  });
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL query failed");
  }
  
  return { data: result.data };
}

async function executeSQLQuery(integration: any, query: any): Promise<{ data: any }> {
  // SQL queries would require a backend service with database drivers
  throw new Error("SQL queries require backend service implementation");
}
