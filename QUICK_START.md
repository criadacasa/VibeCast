# Quick Start Guide - Testing SaaS Features

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Servers (2 terminals)

**Terminal 1 - Backend:**
```bash
cd /home/user/webapp
npx convex dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/user/webapp
pnpm run dev
```

### Step 2: Initialize Data (Terminal 3)

```bash
cd /home/user/webapp

# Seed subscription plans
npx convex run seedPlans:seedSubscriptionPlans

# Run interactive setup
node scripts/test-saas-setup.js
```

The interactive script will guide you through:
1. Getting your member ID
2. Getting a plan ID
3. Generating test commands
4. Optionally saving commands to a script

### Step 3: View in Browser

Open these URLs:
- **Billing Dashboard**: http://127.0.0.1:5173/billing
- **Plan Selector**: http://127.0.0.1:5173/billing/plans
- **Integrations**: http://127.0.0.1:5173/integrations

## 📋 Quick Commands Reference

### View Data

```bash
# Get your member ID (first time)
npx convex dashboard
# Navigate to: Data > convexMembers > copy _id

# Check subscription
npx convex run billing:getCurrentSubscription \
  --memberId "YOUR_MEMBER_ID"

# Check credit balance
npx convex run billing:getCreditBalance \
  --memberId "YOUR_MEMBER_ID"

# Check integrations
npx convex run apiIntegrations:getApiIntegrations \
  --memberId "YOUR_MEMBER_ID"
```

### Create Test Data

```bash
# Create subscription
npx convex run billing:createSubscription \
  --memberId "YOUR_MEMBER_ID" \
  --planId "STARTER_PLAN_ID" \
  --billingPeriod "monthly"

# Record usage
npx convex run billing:recordUsage \
  --memberId "YOUR_MEMBER_ID" \
  --resourceType "llm_tokens" \
  --quantity 1000 \
  --creditCost 10

# Create integration
npx convex run apiIntegrations:createApiIntegration \
  --memberId "YOUR_MEMBER_ID" \
  --name "Test API" \
  --provider "rest_api" \
  --config '{"baseUrl":"https://jsonplaceholder.typicode.com","authType":"none"}'
```

## 🎯 Quick Test Checklist

### Basic Flow (10 minutes)
- [ ] Start both servers
- [ ] Seed plans
- [ ] Open `/billing/plans` - see 4 plans
- [ ] Create subscription via dashboard
- [ ] Open `/billing` - see subscription & credits
- [ ] Record some usage
- [ ] Refresh `/billing` - see updated balance

### Integration Flow (5 minutes)
- [ ] Create REST API integration
- [ ] Open `/integrations` - see your integration
- [ ] Test connection
- [ ] Execute a query
- [ ] Check credit deduction

### Full Test (30 minutes)
- [ ] Follow all 15 test scenarios in `TESTING_GUIDE.md`

## 🔧 Troubleshooting

### "Member not found"
```bash
# Get your member ID from dashboard
npx convex dashboard
# Data > convexMembers > copy _id
```

### "Plan not found"
```bash
# Seed plans again
npx convex run seedPlans:seedSubscriptionPlans
```

### "Insufficient credits"
```bash
# Add bonus credits
npx convex run billing:addCredits \
  --memberId "YOUR_MEMBER_ID" \
  --amount 10000 \
  --type "bonus" \
  --description "Test credits"
```

### UI not updating
1. Check both servers are running
2. Hard refresh browser (Ctrl+Shift+R)
3. Check browser console for errors

## 📊 Understanding the Data

### Credit System
- **Initial allocation**: Based on plan (e.g., 10,000 for Starter)
- **Deduction**: Automatic when recording usage
- **Rollover**: Unused credits carry over (plan-dependent)

### Usage Tracking
- **llm_tokens**: AI model usage
- **api_call**: General API requests
- **data_source_query**: Integration queries
- **deployment**: App deployments
- **storage**: File storage

### Subscription States
- **active**: Fully functional
- **trialing**: In trial period
- **past_due**: Payment failed
- **cancelled**: Ended or will end

## 🎨 UI Components Location

```
app/components/
├── billing/
│   ├── BillingDashboard.tsx    ← Main billing page
│   └── PlanSelector.tsx         ← Plan selection page
└── integrations/
    └── IntegrationsDashboard.tsx ← Integrations page
```

## 🗄️ Database Tables

```
convex/
├── subscriptionPlans    ← Plan definitions
├── subscriptions        ← User subscriptions
├── creditBalances       ← Current balance
├── creditTransactions   ← Transaction log
├── usageRecords         ← Usage details
├── apiIntegrations      ← Integrations
└── apiQueries           ← Saved queries
```

## 📞 Need Help?

1. **Check Logs**: `npx convex dashboard` → Logs tab
2. **View Data**: `npx convex dashboard` → Data tab
3. **Run Functions**: `npx convex dashboard` → Functions tab
4. **Full Guide**: See `TESTING_GUIDE.md`
5. **Architecture**: See `ARCHITECTURE.md`
6. **Features**: See `SAAS_FEATURES.md`

## 🎯 Next Steps

After basic testing:
1. Configure Stripe (for real payments)
2. Test all 15 scenarios in TESTING_GUIDE.md
3. Test on mobile devices
4. Run performance tests
5. Deploy to staging

## 💡 Tips

- Use Convex dashboard for quick data inspection
- Save test commands to a script for reuse
- Test with different plans (Free, Starter, Pro)
- Try hitting plan limits to test enforcement
- Test credit exhaustion scenarios

## 🚀 Production Checklist

Before deploying:
- [ ] Configure Stripe keys
- [ ] Set up webhook endpoint
- [ ] Update Stripe price IDs in plans
- [ ] Test payment flows
- [ ] Enable rate limiting
- [ ] Configure monitoring
- [ ] Set up alerts for low credits
- [ ] Test subscription cancellation
- [ ] Verify invoice generation

---

**Time to Test**: ~5 minutes for basic setup, ~30 minutes for full testing

**Happy Testing! 🎉**
