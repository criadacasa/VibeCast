# Deployment Guide - SaaS Features

## 🚀 Deployment Status

✅ **Code Status**: All changes merged to `main` branch
✅ **GitHub**: All code pushed to https://github.com/criadacasa/VibeCast
✅ **Branch**: `main` is up to date with all SaaS features

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

Before deploying, ensure you have these environment variables configured:

#### Required Environment Variables

```bash
# Convex
CONVEX_DEPLOYMENT=<your-convex-deployment>
VITE_CONVEX_URL=<your-convex-url>

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...  # Use sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# WorkOS (existing auth)
VITE_WORKOS_CLIENT_ID=<your-workos-client-id>
VITE_WORKOS_REDIRECT_URI=<your-redirect-uri>
VITE_WORKOS_API_HOSTNAME=<your-api-hostname>

# Optional: Additional API keys
ANTHROPIC_API_KEY=<your-key>
GOOGLE_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
XAI_API_KEY=<your-key>
```

### 2. Database Migration

The new schema requires running migrations:

```bash
# The schema changes are additive and backward compatible
# No migration script needed - Convex handles schema updates automatically
# Just deploy the new schema.ts file
```

### 3. Seed Subscription Plans

**IMPORTANT**: Run this once after deployment:

```bash
# Connect to your production Convex deployment
npx convex dev --once --prod

# Seed the subscription plans
npx convex run --prod seedPlans:seedSubscriptionPlans

# Verify plans were created
npx convex run --prod billing:getSubscriptionPlans
```

### 4. Configure Stripe

#### Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Create 4 products:
   - **Free Tier** (for reference, $0)
   - **Starter Plan** - $29/month, $290/year
   - **Pro Plan** - $99/month, $990/year
   - **Enterprise Plan** - $499/month, $4,990/year

3. Copy the Price IDs and Product IDs

#### Update Plans with Stripe IDs

```bash
# Update each plan with its Stripe IDs
npx convex run --prod seedPlans:updateStripePriceIds \
  --planName "starter" \
  --stripePriceIdMonthly "price_xxx" \
  --stripePriceIdYearly "price_yyy" \
  --stripeProductId "prod_zzz"

# Repeat for pro and enterprise plans
```

#### Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

## 🏗️ Deployment Steps

### Option A: Vercel Deployment (Recommended)

This project uses Vercel for hosting. Follow these steps:

#### 1. Initial Vercel Setup

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link to Vercel project
vercel link --scope convex-dev --project chef -y

# Pull environment variables (if already configured)
vercel env pull
```

#### 2. Set Environment Variables

```bash
# Add required environment variables
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# Add other required variables as needed
```

#### 3. Deploy to Preview (Staging)

```bash
# Build the project
pnpm run build

# Deploy to preview
vercel

# Test the preview URL thoroughly
# Preview URL will be: https://chef-<unique-id>.vercel.app
```

#### 4. Deploy to Production

```bash
# After testing preview, deploy to production
vercel --prod

# Or push to release branch (per project workflow)
git checkout main
git pull
git push origin main:staging  # Deploy to staging
# Test staging thoroughly
git push origin staging:release  # Deploy to production
```

### Option B: Manual Deployment

If not using Vercel automatic deployment:

```bash
# 1. Build the project
pnpm install
pnpm run build

# 2. Deploy Convex backend
npx convex deploy --prod

# 3. Deploy frontend (platform-specific)
# Follow your hosting provider's deployment instructions
```

## 🔍 Post-Deployment Verification

### 1. Check Convex Functions

```bash
# List all functions
npx convex dashboard --prod
# Navigate to Functions tab and verify new functions are deployed:
# - billing:*
# - apiIntegrations:*
# - seedPlans:*
```

### 2. Verify Database Tables

In Convex Dashboard → Data:
- [ ] subscriptionPlans (should have 4 plans)
- [ ] subscriptions
- [ ] creditBalances
- [ ] creditTransactions
- [ ] usageRecords
- [ ] apiIntegrations
- [ ] apiQueries
- [ ] webhooks
- [ ] payments
- [ ] invoices
- [ ] dailyUsageStats

### 3. Test UI Pages

Visit these URLs on your production domain:
- [ ] `/billing/plans` - Plan selector page loads
- [ ] `/billing` - Billing dashboard (requires auth)
- [ ] `/integrations` - Integrations dashboard (requires auth)

### 4. Test Stripe Webhook

```bash
# Use Stripe CLI to test webhook locally
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

### 5. Test Credit Flow

Create a test subscription and verify:
- [ ] Subscription created
- [ ] Credits allocated
- [ ] Usage can be recorded
- [ ] Credits are deducted
- [ ] Transaction history appears

## 🔒 Security Checklist

Before going live:
- [ ] All API keys are in environment variables (not hardcoded)
- [ ] Stripe webhook secret is configured
- [ ] HTTPS is enabled on all endpoints
- [ ] Rate limiting is configured (per plan)
- [ ] API key masking is working
- [ ] Credential encryption is enabled
- [ ] Authentication is required for all sensitive routes

## 📊 Monitoring Setup

### 1. Set Up Alerts

Configure alerts for:
- Low credit warnings (< 100 credits)
- Payment failures
- API integration errors
- High usage spikes
- Webhook failures

### 2. Analytics

Track these metrics:
- Daily active users
- Credit consumption rate
- Subscription conversions
- API integration usage
- Payment success rate

### 3. Error Tracking

Enable error tracking for:
- Failed payment attempts
- Integration connection errors
- Credit deduction failures
- Webhook processing errors

## 🔄 Rollback Plan

If issues occur after deployment:

### Immediate Rollback (Vercel)

```bash
# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Database Rollback

The new schema is additive, so no rollback needed. If data issues:

```bash
# Connect to production
npx convex dev --once --prod

# Manually clean up test data if needed
# Use Convex dashboard to delete specific records
```

## 📈 Gradual Rollout Strategy

### Phase 1: Beta Testing (Week 1)
1. Enable for internal team only
2. Test all critical flows
3. Monitor for errors
4. Fix any issues found

### Phase 2: Limited Release (Week 2)
1. Enable for 10% of users
2. Monitor usage patterns
3. Gather feedback
4. Optimize based on data

### Phase 3: Full Release (Week 3+)
1. Enable for all users
2. Continue monitoring
3. Iterate on feedback
4. Scale infrastructure as needed

## 🎯 Success Metrics

Track these KPIs post-deployment:
- [ ] Subscription conversion rate > 5%
- [ ] Payment success rate > 98%
- [ ] API integration creation rate
- [ ] Average credits used per user
- [ ] User retention rate
- [ ] Support ticket volume

## 📞 Support Preparation

### Documentation
- [ ] Update main README with SaaS features
- [ ] Create user onboarding guide
- [ ] Write billing FAQ
- [ ] Document API integration setup
- [ ] Create troubleshooting guide

### Support Team Training
- [ ] Train on new billing system
- [ ] Review credit allocation process
- [ ] Understand plan limits
- [ ] Learn integration setup
- [ ] Practice common troubleshooting

## 🐛 Known Issues / Limitations

Current limitations to communicate:
1. Database connections (PostgreSQL, MySQL, MongoDB) require backend proxy
2. OAuth 2.0 token refresh not automated yet
3. Invoice PDF generation pending
4. Team member invites not yet implemented
5. Custom credit packages not available

## 🔮 Future Enhancements (Post-Launch)

Priority enhancements:
1. Automated invoice PDF generation
2. Team management features
3. Usage prediction and alerts
4. Advanced analytics dashboard
5. Mobile app for monitoring
6. API rate limiting dashboard
7. Custom integration builder
8. Webhook retry logic with exponential backoff

## 📝 Deployment Log Template

Use this to track deployments:

```
Date: [DATE]
Deployed By: [NAME]
Environment: [staging/production]
Version: [GIT_SHA]
Changes:
- [CHANGE 1]
- [CHANGE 2]
Issues Found:
- [ISSUE 1]
- [ISSUE 2]
Rollback Required: [YES/NO]
Notes: [ADDITIONAL NOTES]
```

## 🎉 Go-Live Checklist

Final checks before announcing:
- [ ] All environment variables set
- [ ] Subscription plans seeded
- [ ] Stripe configured and tested
- [ ] Webhook endpoint working
- [ ] UI tested on all browsers
- [ ] Mobile responsive verified
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Monitoring configured
- [ ] Backup plan ready
- [ ] Announcement prepared
- [ ] Social media posts scheduled

---

## Summary

✅ **Code**: Merged to main and pushed to GitHub
✅ **Documentation**: Complete with testing guides
✅ **Next Steps**: 
1. Set up environment variables
2. Deploy to staging
3. Seed subscription plans
4. Configure Stripe
5. Test thoroughly
6. Deploy to production

**Estimated Deployment Time**: 2-3 hours
**Testing Time**: 1-2 days
**Go-Live Ready**: After QA approval

---

For questions or issues during deployment, refer to:
- `SAAS_FEATURES.md` - Feature documentation
- `TESTING_GUIDE.md` - Testing procedures
- `ARCHITECTURE.md` - System architecture
- `TROUBLESHOOTING.md` - Common issues (to be created)

Good luck with your deployment! 🚀
