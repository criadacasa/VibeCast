# Testing Guide - SaaS Features

This guide will walk you through testing all the new SaaS features locally.

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Make sure you're on the feature branch
cd /home/user/webapp
git checkout feature/saas-billing-integrations

# Install dependencies (if needed)
pnpm install

# Start the Convex backend
npx convex dev
```

In another terminal:

```bash
# Start the frontend development server
cd /home/user/webapp
pnpm run dev
```

### 2. Seed Subscription Plans

Open a third terminal:

```bash
cd /home/user/webapp

# Seed the subscription plans
npx convex run seedPlans:seedSubscriptionPlans

# Verify plans were created
npx convex run billing:getSubscriptionPlans
```

You should see 4 plans: Free, Starter, Pro, and Enterprise.

## 📋 Test Scenarios

### Test 1: View Subscription Plans

**Goal**: Verify plans are displayed correctly

**Steps**:
1. Start the dev server
2. Navigate to: `http://127.0.0.1:5173/billing/plans` (or your dev port)
3. Toggle between Monthly/Yearly pricing
4. Verify all 4 plans are displayed with correct prices
5. Check that feature lists are complete

**Expected Result**:
- ✅ All plans show correct pricing
- ✅ Monthly/Yearly toggle works
- ✅ Features are listed for each plan
- ✅ Free plan shows $0
- ✅ Savings displayed for yearly plans

### Test 2: Create a Subscription (Manual DB Operation)

**Goal**: Create a test subscription for your user

**Steps**:

```bash
# First, get your member ID from the database
npx convex run --help  # To see available functions

# Create a test subscription using Convex dashboard
# Go to: https://dashboard.convex.dev
```

**Alternative - Use Convex Dashboard**:
1. Open Convex dashboard: `npx convex dashboard`
2. Go to "Data" tab
3. Find your `convexMembers` entry and copy the `_id`
4. In the "Functions" tab, run:

```javascript
// Function: billing:createSubscription
{
  "memberId": "<your-member-id>",
  "planId": "<starter-plan-id>",  // Get from subscriptionPlans table
  "billingPeriod": "monthly"
}
```

**Expected Result**:
- ✅ Subscription created in `subscriptions` table
- ✅ Credit balance created in `creditBalances` table
- ✅ Initial credits allocated (10,000 for Starter)
- ✅ Credit transaction recorded

### Test 3: View Billing Dashboard

**Goal**: Verify billing dashboard displays correctly

**Steps**:
1. Navigate to: `http://127.0.0.1:5173/billing`
2. Check subscription details
3. View credit balance
4. Check transaction history
5. Review usage stats

**Expected Result**:
- ✅ Current plan displayed (e.g., "Starter")
- ✅ Credit balance shown (10,000 initially)
- ✅ Subscription status: "active"
- ✅ Days until renewal calculated
- ✅ Transaction showing initial credit allocation

### Test 4: Record Usage and Deduct Credits

**Goal**: Test credit deduction system

**Steps**:

Using Convex dashboard or CLI:

```javascript
// Function: billing:recordUsage
{
  "memberId": "<your-member-id>",
  "resourceType": "llm_tokens",
  "quantity": 1000,
  "creditCost": 10,
  "modelId": "gpt-4",
  "promptTokens": 500,
  "completionTokens": 500
}
```

**Expected Result**:
- ✅ Usage record created in `usageRecords`
- ✅ Credits deducted (balance: 10,000 - 10 = 9,990)
- ✅ Transaction recorded with negative amount
- ✅ Dashboard updates to show new balance

**Try multiple times with different resource types**:
```javascript
// API call usage
{
  "memberId": "<your-member-id>",
  "resourceType": "api_call",
  "quantity": 1,
  "creditCost": 5
}

// Data source query
{
  "memberId": "<your-member-id>",
  "resourceType": "data_source_query",
  "quantity": 1,
  "creditCost": 2
}
```

### Test 5: View Usage Statistics

**Goal**: Verify usage analytics

**Steps**:
1. After recording several usage events
2. Go to billing dashboard
3. Scroll to "Usage This Month" section
4. Check usage stats query:

```javascript
// Function: billing:getUsageStats
{
  "memberId": "<your-member-id>"
}
```

**Expected Result**:
- ✅ Stats broken down by resource type
- ✅ Total credits spent shown
- ✅ Request counts displayed
- ✅ Progress bars showing usage

### Test 6: Test Insufficient Credits

**Goal**: Verify error handling when credits run out

**Steps**:

```javascript
// First, check current balance
// Function: billing:getCreditBalance
{
  "memberId": "<your-member-id>"
}

// Try to deduct more than available
// Function: billing:recordUsage
{
  "memberId": "<your-member-id>",
  "resourceType": "deployment",
  "quantity": 1,
  "creditCost": 99999  // More than your balance
}
```

**Expected Result**:
- ❌ Error thrown: "Insufficient credits"
- ✅ Balance unchanged
- ✅ No usage record created

### Test 7: Create API Integration

**Goal**: Test integration management

**Steps**:

```javascript
// Function: apiIntegrations:createApiIntegration
{
  "memberId": "<your-member-id>",
  "name": "My Test REST API",
  "provider": "rest_api",
  "config": {
    "baseUrl": "https://jsonplaceholder.typicode.com",
    "authType": "none",
    "timeout": 10000
  }
}
```

**Expected Result**:
- ✅ Integration created in `apiIntegrations` table
- ✅ Status set to "testing"
- ✅ Integration ID returned

### Test 8: View Integrations Dashboard

**Goal**: Verify integrations UI

**Steps**:
1. Navigate to: `http://127.0.0.1:5173/integrations`
2. Check stats cards (total, active, requests, failures)
3. View available providers grid
4. Check your integrations list
5. Click on provider icons

**Expected Result**:
- ✅ Stats cards show correct numbers
- ✅ All 14 providers displayed with icons
- ✅ Your test integration listed
- ✅ Integration status shown
- ✅ Test/Manage/Delete buttons available

### Test 9: Test API Integration Connection

**Goal**: Test connection testing feature

**Steps**:

Using the UI or CLI:

```javascript
// Function: apiIntegrations:testApiIntegration (action)
{
  "integrationId": "<your-integration-id>",
  "memberId": "<your-member-id>"
}
```

**Expected Result**:
- ✅ Connection test runs
- ✅ For JSONPlaceholder API: Success
- ✅ Integration status updated to "active"
- ✅ UI reflects status change

### Test 10: Execute API Query

**Goal**: Test query execution and usage tracking

**Steps**:

```javascript
// Function: apiIntegrations:executeApiQuery (action)
{
  "memberId": "<your-member-id>",
  "integrationId": "<your-integration-id>",
  "queryType": "rest_get",
  "endpoint": "/posts/1"
}
```

**Expected Result**:
- ✅ Query executes successfully
- ✅ Data returned from API
- ✅ Usage recorded in `usageRecords`
- ✅ Credits deducted for query execution
- ✅ Integration stats updated (totalRequests++)
- ✅ Credit cost calculated based on execution time

### Test 11: Create and Use Saved Query

**Goal**: Test saved query functionality

**Steps**:

```javascript
// Step 1: Create saved query
// Function: apiIntegrations:createApiQuery
{
  "memberId": "<your-member-id>",
  "integrationId": "<your-integration-id>",
  "name": "Get All Posts",
  "description": "Fetch all posts from JSONPlaceholder",
  "queryType": "rest_get",
  "endpoint": "/posts",
  "cacheEnabled": true,
  "cacheTTL": 300
}

// Step 2: Execute saved query
// Function: apiIntegrations:executeApiQuery
{
  "memberId": "<your-member-id>",
  "integrationId": "<your-integration-id>",
  "queryId": "<saved-query-id>"
}
```

**Expected Result**:
- ✅ Query saved successfully
- ✅ Query executes using saved configuration
- ✅ Usage count incremented
- ✅ Last used timestamp updated

### Test 12: View Credit Transaction History

**Goal**: Verify transaction tracking

**Steps**:

```javascript
// Function: billing:getCreditTransactions
{
  "memberId": "<your-member-id>",
  "limit": 20
}
```

Or view in the billing dashboard.

**Expected Result**:
- ✅ All transactions listed chronologically
- ✅ Initial allocation shown (monthly_allocation)
- ✅ All deductions shown (usage_deduction)
- ✅ Amounts and descriptions correct
- ✅ Balance after each transaction shown

### Test 13: Plan Limits Enforcement

**Goal**: Test subscription plan limits

**Steps**:

```javascript
// Try creating more integrations than allowed
// For Free plan (2 integrations max):
// Create 3rd integration - should fail

// Function: apiIntegrations:createApiIntegration
{
  "memberId": "<your-member-id>",
  "name": "Third Integration",
  "provider": "graphql",
  "config": { "baseUrl": "https://api.example.com/graphql" }
}
```

**Expected Result**:
- ❌ Error if limit exceeded
- ✅ Error message: "Integration limit reached. Your plan allows X integrations."

### Test 14: Subscription Cancellation

**Goal**: Test subscription cancellation

**Steps**:

```javascript
// Function: billing:cancelSubscription
{
  "subscriptionId": "<your-subscription-id>",
  "immediate": false  // Cancel at period end
}
```

**Expected Result**:
- ✅ Subscription status unchanged (still "active")
- ✅ cancelAtPeriodEnd set to true
- ✅ Warning shown in billing dashboard
- ✅ Credits still usable until period end

### Test 15: Manual Credit Addition

**Goal**: Test adding bonus credits

**Steps**:

```javascript
// Function: billing:addCredits
{
  "memberId": "<your-member-id>",
  "amount": 5000,
  "type": "bonus",
  "description": "Holiday bonus credits!"
}
```

**Expected Result**:
- ✅ Credits added to balance
- ✅ Transaction recorded with type "bonus"
- ✅ Dashboard updated immediately
- ✅ lifetimeEarned increased

## 🔧 Testing with Convex Dashboard

### Accessing Convex Dashboard

```bash
cd /home/user/webapp
npx convex dashboard
```

This opens your browser to the Convex dashboard where you can:

1. **View Data**:
   - Browse all tables
   - See real-time data updates
   - Export data to JSON

2. **Run Functions**:
   - Execute any query/mutation/action
   - See results immediately
   - Test different parameters

3. **Monitor Logs**:
   - View function execution logs
   - Debug errors
   - Track performance

### Key Tables to Monitor

1. **subscriptionPlans** - Check plans are seeded correctly
2. **subscriptions** - Your test subscriptions
3. **creditBalances** - Current credit balance
4. **creditTransactions** - All credit movements
5. **usageRecords** - All usage tracking
6. **apiIntegrations** - Your integrations
7. **apiQueries** - Saved queries

## 🎨 UI Testing Checklist

### Billing Dashboard (`/billing`)
- [ ] Subscription details display correctly
- [ ] Credit balance cards show correct numbers
- [ ] Usage stats render with charts
- [ ] Transaction history scrolls properly
- [ ] Plan features listed correctly
- [ ] Cancel subscription button works
- [ ] Responsive on mobile

### Plan Selector (`/billing/plans`)
- [ ] All 4 plans displayed
- [ ] Monthly/Yearly toggle works
- [ ] Prices update correctly
- [ ] Savings calculation shown
- [ ] Feature lists complete
- [ ] CTA buttons clickable
- [ ] Current plan badge shows
- [ ] Popular badge on Pro plan
- [ ] FAQ section expands

### Integrations Dashboard (`/integrations`)
- [ ] Stats cards show correct numbers
- [ ] Provider grid displays all 14 icons
- [ ] Integration list updates in real-time
- [ ] Status badges show correct colors
- [ ] Test button triggers connection test
- [ ] Manage button opens details
- [ ] Delete button prompts confirmation
- [ ] New integration button opens modal

## 🐛 Common Issues & Solutions

### Issue: Plans not showing
**Solution**:
```bash
npx convex run seedPlans:seedSubscriptionPlans
```

### Issue: "Subscription not found"
**Solution**: Create a test subscription using Convex dashboard

### Issue: Credits not deducting
**Solution**: 
1. Check member ID matches
2. Verify credit balance exists
3. Check function logs in Convex dashboard

### Issue: Integration connection fails
**Solution**:
1. Verify API URL is accessible
2. Check authentication credentials
3. Test with public API (like JSONPlaceholder)

### Issue: UI not updating
**Solution**:
1. Check Convex dev server is running
2. Verify you're using `useQuery` hooks
3. Check browser console for errors

## 📊 Test Data Generator

Here's a script to generate realistic test data:

```javascript
// Run in Convex dashboard - Functions tab

// 1. Create subscription
await ctx.runMutation(api.billing.createSubscription, {
  memberId: "<your-member-id>",
  planId: "<starter-plan-id>",
  billingPeriod: "monthly"
});

// 2. Record various usage types
const usageTypes = [
  { resourceType: "llm_tokens", quantity: 5000, creditCost: 50 },
  { resourceType: "llm_tokens", quantity: 3000, creditCost: 30 },
  { resourceType: "api_call", quantity: 100, creditCost: 10 },
  { resourceType: "data_source_query", quantity: 50, creditCost: 25 },
  { resourceType: "deployment", quantity: 3, creditCost: 30 },
];

for (const usage of usageTypes) {
  await ctx.runMutation(api.billing.recordUsage, {
    memberId: "<your-member-id>",
    ...usage
  });
}

// 3. Create multiple integrations
const integrations = [
  { name: "JSONPlaceholder", provider: "rest_api", baseUrl: "https://jsonplaceholder.typicode.com" },
  { name: "GitHub API", provider: "rest_api", baseUrl: "https://api.github.com" },
  { name: "SpaceX API", provider: "rest_api", baseUrl: "https://api.spacexdata.com/v4" },
];

for (const integration of integrations) {
  await ctx.runMutation(api.apiIntegrations.createApiIntegration, {
    memberId: "<your-member-id>",
    name: integration.name,
    provider: integration.provider,
    config: {
      baseUrl: integration.baseUrl,
      authType: "none",
      timeout: 10000
    }
  });
}
```

## 🎯 Quick Test Script

Save this as `test-saas-features.sh`:

```bash
#!/bin/bash

echo "🧪 Testing SaaS Features..."

# Get member ID
echo "📝 First, get your member ID from Convex dashboard"
echo "   Go to Data > convexMembers and copy your _id"
read -p "Enter your member ID: " MEMBER_ID

# Seed plans
echo ""
echo "🌱 Seeding subscription plans..."
npx convex run seedPlans:seedSubscriptionPlans

# Get plan ID
echo ""
echo "📝 Get Starter plan ID from Convex dashboard"
echo "   Go to Data > subscriptionPlans and copy Starter plan _id"
read -p "Enter Starter plan ID: " PLAN_ID

# Create subscription
echo ""
echo "💳 Creating test subscription..."
cat << EOF | npx convex run billing:createSubscription --stdin
{
  "memberId": "$MEMBER_ID",
  "planId": "$PLAN_ID",
  "billingPeriod": "monthly"
}
EOF

# Record test usage
echo ""
echo "📊 Recording test usage..."
cat << EOF | npx convex run billing:recordUsage --stdin
{
  "memberId": "$MEMBER_ID",
  "resourceType": "llm_tokens",
  "quantity": 1000,
  "creditCost": 10
}
EOF

echo ""
echo "✅ Test data created!"
echo "🌐 Open http://127.0.0.1:5173/billing to view results"
```

Make it executable:
```bash
chmod +x test-saas-features.sh
./test-saas-features.sh
```

## 📱 Mobile Testing

Test responsive design:
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Test on different device sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

**Check**:
- [ ] Plan cards stack on mobile
- [ ] Tables scroll horizontally
- [ ] Buttons are touch-friendly
- [ ] Text is readable

## ⚡ Performance Testing

Check performance metrics:
1. Open Chrome DevTools > Lighthouse
2. Run audit on billing dashboard
3. Check:
   - [ ] Performance score > 90
   - [ ] First Contentful Paint < 1.5s
   - [ ] Time to Interactive < 3.5s

## 🔒 Security Testing

**Test access control**:
1. Try accessing another user's data
2. Verify API key masking in responses
3. Test rate limiting (requires plan setup)

## 📸 Screenshot Checklist

Take screenshots for documentation:
- [ ] Billing dashboard (full page)
- [ ] Plan selector
- [ ] Integrations dashboard
- [ ] Credit transaction history
- [ ] Usage statistics chart
- [ ] Integration details modal

## ✅ Final Verification

Before marking tests complete:
- [ ] All 15 test scenarios pass
- [ ] UI renders correctly in 3 browsers
- [ ] Mobile responsive works
- [ ] No console errors
- [ ] Data persists correctly
- [ ] Real-time updates work
- [ ] Error handling works
- [ ] Documentation is clear

## 🎓 Next Steps After Testing

1. Document any bugs found
2. Test edge cases
3. Performance optimization if needed
4. Prepare for staging deployment
5. Create demo video/screenshots
6. Update README with setup instructions

---

Happy Testing! 🚀

If you encounter issues, check:
- Convex logs: `npx convex dashboard` > Logs tab
- Browser console: F12 > Console
- Network tab: F12 > Network (for API calls)
