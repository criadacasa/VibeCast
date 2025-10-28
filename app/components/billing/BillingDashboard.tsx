/**
 * Billing Dashboard Component
 * 
 * Displays user's subscription, credit balance, usage stats, and payment history
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import type { Id } from "~/convex/_generated/dataModel";

interface BillingDashboardProps {
  memberId: Id<"convexMembers">;
}

export function BillingDashboard({ memberId }: BillingDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("monthly");
  
  // Fetch data
  const subscription = useQuery(api.billing.getCurrentSubscription, { memberId });
  const creditBalance = useQuery(api.billing.getCreditBalance, { memberId });
  const transactions = useQuery(api.billing.getCreditTransactions, { memberId, limit: 10 });
  const usageStats = useQuery(api.billing.getUsageStats, { memberId });
  const plans = useQuery(api.billing.getSubscriptionPlans);
  
  // Mutations
  const cancelSubscription = useMutation(api.billing.cancelSubscription);
  
  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period."
    );
    
    if (confirmed) {
      await cancelSubscription({
        subscriptionId: subscription._id,
        immediate: false,
      });
    }
  };
  
  if (!subscription || !creditBalance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading billing information...</div>
      </div>
    );
  }
  
  const plan = subscription.plan;
  const daysUntilRenewal = Math.ceil(
    (subscription.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => {
            // Navigate to plan selection
            window.location.href = "/billing/plans";
          }}
        >
          Upgrade Plan
        </button>
      </div>
      
      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Current Plan: {plan?.displayName}
            </h2>
            <p className="text-gray-600 mb-4">{plan?.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  subscription.status === "active" ? "bg-green-100 text-green-800" :
                  subscription.status === "trialing" ? "bg-blue-100 text-blue-800" :
                  subscription.status === "cancelled" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {subscription.status}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-600">Billing Period:</span>
                <span className="ml-2 font-medium">{subscription.billingPeriod}</span>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-600">Renews in:</span>
                <span className="ml-2 font-medium">{daysUntilRenewal} days</span>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-600">Price:</span>
                <span className="ml-2 font-medium">
                  ${(subscription.billingPeriod === "monthly" 
                    ? plan?.monthlyPrice 
                    : plan?.yearlyPrice) / 100}/
                  {subscription.billingPeriod === "monthly" ? "month" : "year"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {subscription.cancelAtPeriodEnd ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  Subscription will cancel on{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <button
                onClick={handleCancelSubscription}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Credit Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">Current Balance</h3>
          <div className="text-4xl font-bold mb-1">
            {creditBalance.balance.toLocaleString()}
          </div>
          <p className="text-sm opacity-90">credits available</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">Lifetime Earned</h3>
          <div className="text-4xl font-bold mb-1">
            {creditBalance.lifetimeEarned.toLocaleString()}
          </div>
          <p className="text-sm opacity-90">total credits</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">Lifetime Spent</h3>
          <div className="text-4xl font-bold mb-1">
            {creditBalance.lifetimeSpent.toLocaleString()}
          </div>
          <p className="text-sm opacity-90">total credits</p>
        </div>
      </div>
      
      {/* Usage Stats */}
      {usageStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Usage This Month
          </h2>
          
          <div className="space-y-4">
            {Object.entries(usageStats.stats).map(([type, stats]: [string, any]) => (
              <div key={type} className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700 capitalize">
                    {type.replace(/_/g, " ")}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {stats.count} requests
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Credits used: {stats.totalCreditCost.toLocaleString()}</span>
                  <span>Total: {stats.totalQuantity.toLocaleString()}</span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (stats.totalCreditCost / usageStats.totalCreditsSpent) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t-2 border-gray-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Total</h3>
                <span className="text-lg font-bold text-gray-900">
                  {usageStats.totalCreditsSpent.toLocaleString()} credits
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h2>
        
        <div className="space-y-3">
          {transactions?.map((transaction) => (
            <div
              key={transaction._id}
              className="flex items-center justify-between py-3 border-b"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  transaction.type === "usage_deduction" 
                    ? "bg-red-100 text-red-800" 
                    : "bg-green-100 text-green-800"
                }`}>
                  {transaction.type.replace(/_/g, " ")}
                </span>
                
                <span className={`font-semibold ${
                  transaction.amount > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <button
          className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          onClick={() => {
            window.location.href = "/billing/history";
          }}
        >
          View Full History →
        </button>
      </div>
      
      {/* Plan Features */}
      {plan && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Plan Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">
                {plan.monthlyCredits.toLocaleString()} credits/month
              </span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">
                {plan.maxProjects === "unlimited" ? "Unlimited" : plan.maxProjects} projects
              </span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">
                {plan.maxApiIntegrations === "unlimited" ? "Unlimited" : plan.maxApiIntegrations} API integrations
              </span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">
                {plan.apiRateLimit} requests/minute
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium text-gray-900 mb-2">Additional Features:</h3>
            <ul className="space-y-1">
              {plan.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
