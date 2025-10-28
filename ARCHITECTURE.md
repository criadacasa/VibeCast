# SaaS Platform Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Remix)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │     Billing      │  │   Integrations   │  │    Analytics     │  │
│  │    Dashboard     │  │    Dashboard     │  │    Dashboard     │  │
│  │                  │  │                  │  │                  │  │
│  │ • Subscription   │  │ • Providers      │  │ • Usage Stats    │  │
│  │ • Credits        │  │ • Connections    │  │ • Cost Analysis  │  │
│  │ • Transactions   │  │ • Queries        │  │ • Trends         │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Plan Selector   │  │  Query Builder   │  │    Settings      │  │
│  │                  │  │                  │  │                  │  │
│  │ • Pricing        │  │ • REST/GraphQL   │  │ • API Keys       │  │
│  │ • Comparison     │  │ • SQL Editor     │  │ • Webhooks       │  │
│  │ • Checkout       │  │ • Testing        │  │ • Team           │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                         Convex Client SDK
                                │
┌───────────────────────────────┴─────────────────────────────────────┐
│                      Backend (Convex Functions)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Billing Module                               │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Subscription Management    • Usage Metering                  │ │
│  │ • Credit Allocation          • Payment Processing              │ │
│  │ • Transaction History        • Invoice Generation              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │               API Integrations Module                          │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Connection Management      • Query Execution                 │ │
│  │ • Credential Storage         • Caching Layer                   │ │
│  │ • Health Monitoring          • Error Handling                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  Analytics Module                              │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Daily Aggregations         • Real-time Stats                │ │
│  │ • Historical Trends          • Cost Projections               │ │
│  │ • Resource Tracking          • Performance Metrics            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────┐
│                    Convex Database Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ subscriptionPlans│  │  subscriptions  │  │ creditBalances  │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │creditTransactions│ │  usageRecords   │  │ apiIntegrations │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   apiQueries    │  │    webhooks     │  │    payments     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │    invoices     │  │ dailyUsageStats │                          │
│  └─────────────────┘  └─────────────────┘                          │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────┐
│                     External Services                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Stripe    │  │  REST APIs   │  │   GraphQL    │             │
│  │              │  │              │  │              │             │
│  │ • Payments   │  │ • Data Fetch │  │ • Queries    │             │
│  │ • Webhooks   │  │ • Auth       │  │ • Mutations  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  PostgreSQL  │  │    MySQL     │  │   MongoDB    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Airtable   │  │ Google Sheets│  │  Salesforce  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Subscription Creation Flow

```
User → PlanSelector → createSubscription() → Convex DB
                            ↓
                     Stripe API ← stripeSubscriptionId
                            ↓
                     Webhook → handleStripeWebhook()
                            ↓
                     allocateMonthlyCredits()
                            ↓
                     creditBalances → User Dashboard
```

### 2. Usage Recording Flow

```
User Action → App → recordUsage()
                        ↓
                   ┌────┴────┐
                   │         │
            usageRecords  deductCredits()
                   │         │
                   │    creditBalances
                   │         │
                   └────┬────┘
                        ↓
                dailyUsageStats (async aggregation)
```

### 3. API Integration Flow

```
User → IntegrationsDashboard → createApiIntegration()
                                        ↓
                                  apiIntegrations
                                        ↓
                                testApiIntegration() ← External API
                                        ↓
                                 Status Update
                                        ↓
                              executeApiQuery() → Data
                                        ↓
                                  recordUsage()
                                        ↓
                                deductCredits()
```

## Component Hierarchy

```
App
├── BillingDashboard
│   ├── SubscriptionCard
│   ├── CreditBalanceDisplay
│   ├── UsageStatsChart
│   └── TransactionHistory
│
├── PlanSelector
│   ├── PlanCard (x4)
│   │   ├── PlanHeader
│   │   ├── PriceDisplay
│   │   ├── FeatureList
│   │   └── CTAButton
│   └── FAQSection
│
├── IntegrationsDashboard
│   ├── ProviderGrid
│   ├── IntegrationsList
│   │   └── IntegrationCard
│   │       ├── ConnectionStatus
│   │       ├── StatsDisplay
│   │       └── ActionButtons
│   ├── NewIntegrationModal
│   │   ├── ProviderSelector
│   │   ├── ConfigForm
│   │   └── TestConnection
│   └── IntegrationDetailsModal
│       ├── QueryList
│       ├── QueryEditor
│       └── ExecutionHistory
│
└── AnalyticsDashboard (Future)
    ├── UsageTrends
    ├── CostProjections
    └── ResourceBreakdown
```

## Database Schema Relationships

```
convexMembers (1) ──┬── (N) subscriptions
                    │
                    ├── (N) creditBalances (1:1)
                    │
                    ├── (N) creditTransactions
                    │
                    ├── (N) usageRecords
                    │
                    ├── (N) apiIntegrations
                    │
                    ├── (N) payments
                    │
                    └── (N) invoices

subscriptionPlans (1) ──── (N) subscriptions

apiIntegrations (1) ──┬── (N) apiQueries
                      │
                      └── (N) webhooks

subscriptions (1) ──┬── (N) creditTransactions
                    │
                    ├── (N) payments
                    │
                    └── (N) invoices

usageRecords (N) ────── (1) creditTransactions
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│         Request Layer                        │
├─────────────────────────────────────────────┤
│ • Authentication (WorkOS/OAuth)              │
│ • Rate Limiting (per plan)                   │
│ • Input Validation                           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│         Function Layer                       │
├─────────────────────────────────────────────┤
│ • Member ID Verification                     │
│ • Resource Ownership Check                   │
│ • Credit Balance Validation                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│         Data Layer                           │
├─────────────────────────────────────────────┤
│ • Encrypted Storage (credentials)            │
│ • API Key Masking (responses)                │
│ • Webhook Signature Verification             │
└─────────────────────────────────────────────┘
```

## Credit Flow System

```
                    ┌─────────────────┐
                    │  Monthly Cron   │
                    │  or New Sub     │
                    └────────┬────────┘
                             │
                             ↓
                ┌────────────────────────┐
                │ allocateMonthlyCredits │
                └────────────┬───────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ↓                 ↓
          ┌──────────────┐    ┌──────────────┐
          │ Check Rollover│    │  Add Credits  │
          │   (if enabled)│    │  to Balance   │
          └──────────────┘    └──────┬─────────┘
                                     │
                        ┌────────────┴────────────┐
                        │ creditTransactions      │
                        │ (type: monthly_allocation)│
                        └─────────────────────────┘

User Action → recordUsage() → deductCredits()
                                     │
                        ┌────────────┴────────────┐
                        │ Check Balance           │
                        │ (throw if insufficient) │
                        └────────┬────────────────┘
                                 │
                        ┌────────┴────────────┐
                        │ Deduct from Balance │
                        └────────┬────────────┘
                                 │
                        ┌────────┴────────────┐
                        │ creditTransactions  │
                        │ (type: usage_deduction)│
                        └─────────────────────┘
```

## Integration Architecture

```
                    ┌─────────────────┐
                    │   User Request   │
                    └────────┬────────┘
                             │
                             ↓
                ┌────────────────────────┐
                │  executeApiQuery()      │
                └────────────┬───────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ↓                 ↓
          ┌──────────────┐    ┌──────────────┐
          │Get Integration│    │Get Saved Query│
          │  Credentials  │    │  (if queryId) │
          └──────┬───────┘    └──────┬────────┘
                 │                    │
                 └──────────┬─────────┘
                            │
                            ↓
                ┌──────────────────────┐
                │  Execute Based on    │
                │  Provider Type       │
                └──────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
┌────────────┐    ┌────────────┐    ┌────────────┐
│ REST Query │    │GraphQL Query│   │ SQL Query  │
└─────┬──────┘    └─────┬──────┘    └─────┬──────┘
      │                 │                  │
      └─────────────────┼──────────────────┘
                        │
                        ↓
            ┌──────────────────────┐
            │ External Data Source │
            └──────────┬───────────┘
                       │
                       ↓
            ┌──────────────────────┐
            │   Process Result     │
            └──────────┬───────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Record Usage  │ │Update Stats  │ │Return Data   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Scaling Considerations

### Horizontal Scaling
- Convex automatically scales functions
- Database queries use indexes
- Caching layer for frequent queries

### Vertical Optimizations
- Batch credit operations
- Daily usage aggregations (async)
- Query result caching with TTL
- Lazy loading in UI components

### Performance Targets
- API response time: < 200ms (p95)
- Query execution: < 1s (p95)
- Credit operations: < 100ms (p95)
- Dashboard load: < 2s (initial)

## Monitoring & Observability

```
Application Metrics
    ↓
┌─────────────────────────────────┐
│ • Credit Balance Alerts          │
│ • Usage Spikes Detection         │
│ • Failed Integration Attempts    │
│ • Payment Failures               │
│ • Query Performance              │
└─────────────────────────────────┘
    ↓
Alert System → Admin Dashboard
```

## Deployment Architecture

```
┌───────────────────────────────────────────┐
│           Production Environment           │
├───────────────────────────────────────────┤
│                                            │
│  Vercel (Frontend) ←→ Convex (Backend)    │
│         ↓                    ↓             │
│    Static Assets        Live Database     │
│                              ↓             │
│                         Stripe API         │
│                              ↓             │
│                      External APIs         │
│                                            │
└───────────────────────────────────────────┘
```

---

This architecture provides a scalable, secure, and maintainable foundation for the SaaS platform.
