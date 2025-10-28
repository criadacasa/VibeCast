#!/usr/bin/env node

/**
 * Quick Setup Script for Testing SaaS Features
 * 
 * This script helps you quickly set up test data for the SaaS features.
 * Run this after seeding subscription plans.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 SaaS Features Quick Setup\n');
  console.log('This script will help you create test data for the SaaS features.\n');
  
  // Step 1: Verify plans are seeded
  console.log('📋 Step 1: Seed Subscription Plans');
  console.log('Run this command in another terminal:');
  console.log('  npx convex run seedPlans:seedSubscriptionPlans\n');
  
  const seeded = await question('Have you seeded the plans? (y/n): ');
  if (seeded.toLowerCase() !== 'y') {
    console.log('\n❌ Please seed the plans first, then run this script again.');
    rl.close();
    return;
  }
  
  // Step 2: Get member ID
  console.log('\n👤 Step 2: Get Your Member ID');
  console.log('1. Open Convex dashboard: npx convex dashboard');
  console.log('2. Go to Data > convexMembers');
  console.log('3. Copy your _id field\n');
  
  const memberId = await question('Enter your member ID: ');
  if (!memberId) {
    console.log('\n❌ Member ID is required.');
    rl.close();
    return;
  }
  
  // Step 3: Get plan ID
  console.log('\n💳 Step 3: Get Starter Plan ID');
  console.log('1. In Convex dashboard, go to Data > subscriptionPlans');
  console.log('2. Find the "Starter" plan');
  console.log('3. Copy its _id field\n');
  
  const planId = await question('Enter Starter plan ID: ');
  if (!planId) {
    console.log('\n❌ Plan ID is required.');
    rl.close();
    return;
  }
  
  // Step 4: Generate commands
  console.log('\n✨ Great! Here are the commands to set up your test data:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1️⃣  CREATE SUBSCRIPTION:\n');
  console.log('npx convex run billing:createSubscription \\');
  console.log(`  --memberId "${memberId}" \\`);
  console.log(`  --planId "${planId}" \\`);
  console.log('  --billingPeriod "monthly"\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('2️⃣  RECORD SAMPLE USAGE (LLM Tokens):\n');
  console.log('npx convex run billing:recordUsage \\');
  console.log(`  --memberId "${memberId}" \\`);
  console.log('  --resourceType "llm_tokens" \\');
  console.log('  --quantity 1000 \\');
  console.log('  --creditCost 10 \\');
  console.log('  --modelId "gpt-4"\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('3️⃣  CREATE TEST API INTEGRATION:\n');
  console.log('npx convex run apiIntegrations:createApiIntegration \\');
  console.log(`  --memberId "${memberId}" \\`);
  console.log('  --name "JSONPlaceholder API" \\');
  console.log('  --provider "rest_api" \\');
  console.log('  --config \'{"baseUrl":"https://jsonplaceholder.typicode.com","authType":"none","timeout":10000}\'\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('4️⃣  VIEW YOUR DATA:\n');
  console.log('# Check your subscription');
  console.log(`npx convex run billing:getCurrentSubscription --memberId "${memberId}"\n`);
  console.log('# Check your credit balance');
  console.log(`npx convex run billing:getCreditBalance --memberId "${memberId}"\n`);
  console.log('# Check your integrations');
  console.log(`npx convex run apiIntegrations:getApiIntegrations --memberId "${memberId}"\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('5️⃣  OPEN THE UI:\n');
  console.log('http://127.0.0.1:5173/billing        - Billing Dashboard');
  console.log('http://127.0.0.1:5173/billing/plans  - Plan Selector');
  console.log('http://127.0.0.1:5173/integrations   - Integrations Dashboard\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('💡 TIP: Copy these commands to a file for easy reuse!\n');
  
  const saveToFile = await question('Save commands to test-commands.sh? (y/n): ');
  
  if (saveToFile.toLowerCase() === 'y') {
    const fs = require('fs');
    const path = require('path');
    
    const scriptContent = `#!/bin/bash
# SaaS Features Test Commands
# Generated on ${new Date().toISOString()}

MEMBER_ID="${memberId}"
PLAN_ID="${planId}"

echo "🧪 Setting up test data..."
echo ""

# Create subscription
echo "1️⃣  Creating subscription..."
npx convex run billing:createSubscription \\
  --memberId "$MEMBER_ID" \\
  --planId "$PLAN_ID" \\
  --billingPeriod "monthly"

echo ""
echo "✅ Subscription created!"
echo ""

# Record usage
echo "2️⃣  Recording sample usage..."
npx convex run billing:recordUsage \\
  --memberId "$MEMBER_ID" \\
  --resourceType "llm_tokens" \\
  --quantity 1000 \\
  --creditCost 10 \\
  --modelId "gpt-4"

echo ""
echo "✅ Usage recorded!"
echo ""

# Create integration
echo "3️⃣  Creating test integration..."
npx convex run apiIntegrations:createApiIntegration \\
  --memberId "$MEMBER_ID" \\
  --name "JSONPlaceholder API" \\
  --provider "rest_api" \\
  --config '{"baseUrl":"https://jsonplaceholder.typicode.com","authType":"none","timeout":10000}'

echo ""
echo "✅ Integration created!"
echo ""

# View data
echo "4️⃣  Fetching your data..."
echo ""
echo "📊 Subscription:"
npx convex run billing:getCurrentSubscription --memberId "$MEMBER_ID"

echo ""
echo "💰 Credit Balance:"
npx convex run billing:getCreditBalance --memberId "$MEMBER_ID"

echo ""
echo "🔌 Integrations:"
npx convex run apiIntegrations:getApiIntegrations --memberId "$MEMBER_ID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup complete! Open these URLs:"
echo "   http://127.0.0.1:5173/billing"
echo "   http://127.0.0.1:5173/billing/plans"
echo "   http://127.0.0.1:5173/integrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
`;
    
    const scriptPath = path.join(process.cwd(), 'test-commands.sh');
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    
    console.log(`\n✅ Commands saved to: test-commands.sh`);
    console.log('   Run it with: ./test-commands.sh\n');
  }
  
  console.log('🎉 Setup guide complete!');
  console.log('📚 For more details, see TESTING_GUIDE.md\n');
  
  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
