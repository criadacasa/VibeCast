# SaaS Platform Features Documentation

## Overview

This document describes the comprehensive SaaS transformation of the Vibe Code Platform (Chef), including credit-based billing, subscription plans, and native API integrations for data sources.

## 🎯 Key Features

### 1. Credit-Based System
- **Credit Allocation**: Monthly credits based on subscription tier
- **Usage Tracking**: Real-time tracking of credit consumption
- **Credit Rollover**: Unused credits roll over (plan-dependent)
- **Credit Transactions**: Complete history of credit additions and deductions
- **Low Balance Alerts**: Notifications when credits run low

### 2. Subscription Plans

#### Free Plan
- **Price**: $0/month
- **Credits**: 1,000/month
- **Projects**: Up to 3
- **API Integrations**: 2
- **Team Members**: 1
- **Features**:
  - Community support
  - Basic analytics
  - 60 API requests/minute

#### Starter Plan
- **Price**: $29/month or $290/year (save $58)
- **Credits**: 10,000/month
- **Rollover**: Up to 5,000 credits
- **Projects**: Up to 10
- **API Integrations**: 10
- **Team Members**: 3
- **Features**:
  - Email support
  - Advanced analytics
  - Custom domains
  - 300 API requests/minute

#### Pro Plan
- **Price**: $99/month or $990/year (save $198)
- **Credits**: 50,000/month
- **Rollover**: Up to 25,000 credits
- **Projects**: Up to 50
- **API Integrations**: 50
- **Team Members**: 10
- **Features**:
  - Priority support
  - Advanced analytics & reporting
  - White-label options
  - SSO (Single Sign-On)
  - Advanced webhooks
  - 1,000 API requests/minute

#### Enterprise Plan
- **Price**: Starting at $499/month
- **Credits**: 250,000+/month (customizable)
- **Rollover**: Unlimited
- **Projects**: Unlimited
- **API Integrations**: Unlimited
- **Team Members**: Unlimited
- **Features**:
  - 24/7 dedicated support
  - Custom analytics
  - SLA guarantees
  - Custom integrations
  - On-premise deployment option
  - Dedicated account manager
  - 5,000 API requests/minute

### 3. Native API Integrations

The platform now supports native integrations with major data source providers:

#### Supported Providers

**APIs & Web Services**
- REST APIs (with authentication)
- GraphQL endpoints
- Custom webhooks

**Databases**
- PostgreSQL
- MySQL
- MongoDB

**SaaS Platforms**
- Airtable
- Google Sheets
- Stripe
- Salesforce
- HubSpot
- Shopify
- Firebase
- Supabase

#### Integration Features

- **Authentication Support**:
  - API Keys
  - Bearer Tokens
  - OAuth 2.0
  - Basic Authentication
  
- **Query Management**:
  - Save and reuse queries
  - Ad-hoc query execution
  - Query caching with TTL
  - Variables and parameters
  
- **Error Handling**:
  - Automatic retries
  - Error logging
  - Connection testing
  - Health monitoring

- **Security**:
  - Encrypted credential storage
  - Secure API key management
  - Access control per member

### 4. Usage Tracking & Analytics

#### Resource Types Tracked
- LLM token usage (prompt, completion, cached)
- API calls to integrations
- Storage usage
- Deployment operations
- Data source queries

#### Analytics Dashboard
- Real-time credit balance
- Usage by resource type
- Historical trends
- Cost projections
- Integration performance metrics

### 5. Billing & Payments

#### Stripe Integration
- Secure payment processing
- Automatic subscription renewals
- Prorated upgrades/downgrades
- Invoice generation
- Payment history

#### Features
- Multiple payment methods
- Automatic invoice generation
- Failed payment handling
- Subscription management
- Refund processing

## 📊 Database Schema

### New Tables

#### `subscriptionPlans`
Defines available subscription tiers with pricing and limits.

#### `subscriptions`
Tracks user subscriptions with billing periods and status.

#### `creditBalances`
Stores current credit balance and lifetime statistics per user.

#### `creditTransactions`
Complete transaction history of all credit additions and deductions.

#### `usageRecords`
Detailed tracking of resource consumption with credit costs.

#### `apiIntegrations`
Configuration and credentials for data source connections.

#### `apiQueries`
Saved queries for reusable data source operations.

#### `webhooks`
Webhook configurations for real-time integrations.

#### `payments`
Payment transaction records.

#### `invoices`
Generated invoices for subscriptions.

#### `dailyUsageStats`
Aggregated daily usage statistics for analytics.

## 🔧 Implementation Details

### Backend (Convex Functions)

#### `convex/billing.ts`
- Subscription management (CRUD operations)
- Credit allocation and deduction
- Usage recording and tracking
- Stripe webhook handling
- Payment processing

#### `convex/apiIntegrations.ts`
- Integration management (CRUD)
- Connection testing
- Query execution
- Usage metering
- Error handling

#### `convex/seedPlans.ts`
- Initial plan seeding
- Stripe price ID configuration

### Frontend Components

#### `app/components/billing/BillingDashboard.tsx`
Comprehensive billing dashboard showing:
- Current subscription details
- Credit balance and usage
- Transaction history
- Plan features
- Subscription management

#### `app/components/billing/PlanSelector.tsx`
Plan selection interface with:
- Monthly/yearly pricing toggle
- Feature comparison
- Upgrade/downgrade flows
- FAQ section

#### `app/components/integrations/IntegrationsDashboard.tsx`
API integrations management with:
- Available providers
- Active integrations
- Connection testing
- Query management
- Usage statistics

## 🚀 Getting Started

### 1. Seed Subscription Plans

```bash
# Run the seed function to create default plans
npx convex run seedPlans:seedSubscriptionPlans
```

### 2. Configure Stripe

1. Create products and prices in Stripe dashboard
2. Update plan records with Stripe IDs:

```bash
npx convex run seedPlans:updateStripePriceIds \
  --planName "starter" \
  --stripePriceIdMonthly "price_xxx" \
  --stripePriceIdYearly "price_yyy" \
  --stripeProductId "prod_zzz"
```

3. Set up Stripe webhook endpoint at `/api/webhooks/stripe`

### 3. Environment Variables

Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Access the Features

- **Billing Dashboard**: `/billing`
- **Plan Selection**: `/billing/plans`
- **API Integrations**: `/integrations`
- **Usage Analytics**: `/billing/usage`

## 💳 Credit Cost Structure

### Default Costs (adjustable)

- **LLM Usage**: 
  - 1 credit per 1,000 tokens (prompt)
  - 2 credits per 1,000 tokens (completion)
  
- **API Calls**:
  - 1 credit per request + execution time
  
- **Data Source Queries**:
  - 1 credit base + execution time
  
- **Storage**:
  - 0.1 credits per GB per month
  
- **Deployments**:
  - 10 credits per deployment

## 🔐 Security Considerations

### Credential Storage
- API keys and passwords are stored encrypted
- Sensitive data masked in API responses
- Access control per member

### API Rate Limiting
- Per-plan rate limits enforced
- Rate limit headers in responses
- Graceful degradation on limit exceeded

### Webhook Security
- Signature verification for all webhooks
- Replay attack prevention
- IP whitelist support

## 📈 Future Enhancements

### Planned Features
- [ ] Team management and role-based access
- [ ] Custom credit packages
- [ ] Volume discounts
- [ ] Referral program
- [ ] Advanced analytics dashboard
- [ ] Data source schema introspection
- [ ] Query builder UI
- [ ] Real-time collaboration
- [ ] Audit logs
- [ ] Compliance reports (GDPR, SOC2)

### Additional Integrations
- [ ] AWS services (S3, DynamoDB, etc.)
- [ ] Google Cloud services
- [ ] Microsoft Azure services
- [ ] Slack, Discord, Telegram
- [ ] Email providers (SendGrid, Mailgun)
- [ ] Analytics platforms (Mixpanel, Amplitude)

## 🐛 Troubleshooting

### Common Issues

**Issue**: Credits not deducted after usage
- Check usage record creation
- Verify credit balance mutation
- Review error logs in usage metadata

**Issue**: Stripe webhook not working
- Verify webhook secret configuration
- Check endpoint URL configuration
- Review Stripe dashboard logs

**Issue**: Integration connection fails
- Test connection manually
- Check credentials validity
- Review error messages in integration record

## 📚 API Reference

### Query Functions

```typescript
// Get subscription plans
api.billing.getSubscriptionPlans()

// Get user subscription
api.billing.getCurrentSubscription({ memberId })

// Get credit balance
api.billing.getCreditBalance({ memberId })

// Get usage stats
api.billing.getUsageStats({ memberId, startDate?, endDate? })

// Get API integrations
api.apiIntegrations.getApiIntegrations({ memberId, status? })
```

### Mutation Functions

```typescript
// Create subscription
api.billing.createSubscription({ memberId, planId, billingPeriod })

// Add credits
api.billing.addCredits({ memberId, amount, type, description })

// Record usage
api.billing.recordUsage({ memberId, resourceType, quantity, creditCost })

// Create integration
api.apiIntegrations.createApiIntegration({ memberId, name, provider, config })

// Execute query
api.apiIntegrations.executeApiQuery({ memberId, integrationId, ... })
```

### Action Functions

```typescript
// Test integration
api.apiIntegrations.testApiIntegration({ integrationId, memberId })
```

## 🤝 Support

For questions or issues:
- Documentation: `/docs`
- Email: support@yourdomain.com
- Community: Discord/Slack channel
- Enterprise: Dedicated account manager

## 📝 License

This SaaS platform extension maintains the same license as the base Chef platform (MIT License).
