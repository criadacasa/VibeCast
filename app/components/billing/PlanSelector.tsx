/**
 * Plan Selector Component
 * 
 * Displays available subscription plans and allows users to select and subscribe
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import type { Id } from "~/convex/_generated/dataModel";

interface PlanSelectorProps {
  memberId: Id<"convexMembers">;
  currentPlanId?: Id<"subscriptionPlans">;
}

export function PlanSelector({ memberId, currentPlanId }: PlanSelectorProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Id<"subscriptionPlans"> | null>(null);
  
  const plans = useQuery(api.billing.getSubscriptionPlans);
  const createSubscription = useMutation(api.billing.createSubscription);
  
  const handleSelectPlan = async (planId: Id<"subscriptionPlans">) => {
    try {
      // In a real implementation, this would:
      // 1. Create a Stripe checkout session
      // 2. Redirect to Stripe
      // 3. Handle webhook to create subscription
      
      const confirmed = window.confirm(
        "This will redirect you to our payment processor to complete the subscription."
      );
      
      if (!confirmed) return;
      
      // For now, create subscription directly (in production, this happens via webhook)
      await createSubscription({
        memberId,
        planId,
        billingPeriod,
      });
      
      alert("Subscription created successfully!");
      window.location.href = "/billing";
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  if (!plans) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading plans...</div>
      </div>
    );
  }
  
  const savings = billingPeriod === "yearly" ? "Save up to 17%" : null;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Start building powerful AI-powered apps with our flexible pricing plans.
          All plans include access to our core features.
        </p>
      </div>
      
      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="bg-gray-100 rounded-lg p-1 inline-flex">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              billingPeriod === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-6 py-2 rounded-lg font-medium transition relative ${
              billingPeriod === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yearly
            {savings && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                {savings}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = billingPeriod === "monthly" 
            ? plan.monthlyPrice 
            : (plan.yearlyPrice || plan.monthlyPrice * 12);
          
          const isCurrentPlan = currentPlanId === plan._id;
          const isPremiumPlan = plan.name === "pro" || plan.name === "enterprise";
          
          return (
            <div
              key={plan._id}
              className={`relative bg-white rounded-xl shadow-lg p-6 flex flex-col ${
                isPremiumPlan ? "border-2 border-blue-500" : "border border-gray-200"
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {/* Popular Badge */}
              {plan.name === "pro" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    CURRENT
                  </span>
                </div>
              )}
              
              {/* Plan Name */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.displayName}
                </h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
              
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    ${price / 100}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingPeriod === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                {billingPeriod === "yearly" && plan.yearlyPrice && (
                  <p className="text-sm text-green-600 mt-1">
                    Save ${(plan.monthlyPrice * 12 - plan.yearlyPrice) / 100}/year
                  </p>
                )}
              </div>
              
              {/* Credits */}
              <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {plan.monthlyCredits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">credits per month</div>
                {plan.rolloverCredits && (
                  <div className="text-xs text-gray-500 mt-1">
                    ✓ Rollover enabled
                  </div>
                )}
              </div>
              
              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {/* Key metrics */}
                <li className="flex items-start text-sm">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">
                    {plan.maxProjects === "unlimited" ? "Unlimited" : plan.maxProjects} projects
                  </span>
                </li>
                
                <li className="flex items-start text-sm">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">
                    {plan.maxApiIntegrations === "unlimited" ? "Unlimited" : plan.maxApiIntegrations} API integrations
                  </span>
                </li>
                
                <li className="flex items-start text-sm">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">
                    {plan.maxTeamMembers === "unlimited" ? "Unlimited" : plan.maxTeamMembers} team members
                  </span>
                </li>
                
                <li className="flex items-start text-sm">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">
                    {plan.apiRateLimit} API calls/min
                  </span>
                </li>
                
                {/* Additional features (show first 3) */}
                {plan.features.slice(0, 3).map((feature: string, index: number) => (
                  <li key={index} className="flex items-start text-sm">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan._id)}
                disabled={isCurrentPlan}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                  isCurrentPlan
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isPremiumPlan
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {isCurrentPlan 
                  ? "Current Plan" 
                  : plan.monthlyPrice === 0 
                  ? "Get Started Free" 
                  : "Subscribe Now"}
              </button>
              
              {/* Enterprise Contact */}
              {plan.name === "enterprise" && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  Or <a href="/contact-sales" className="text-blue-600 hover:underline">contact sales</a> for custom pricing
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Feature Comparison Link */}
      <div className="text-center mt-12">
        <a
          href="/pricing/compare"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Compare all features →
        </a>
      </div>
      
      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          <details className="bg-white rounded-lg p-6 shadow-sm">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              What are credits and how do they work?
            </summary>
            <p className="mt-3 text-gray-600">
              Credits are used to pay for AI model usage, API calls, storage, and other platform features.
              Different actions consume different amounts of credits. You can track your usage in real-time
              from your dashboard.
            </p>
          </details>
          
          <details className="bg-white rounded-lg p-6 shadow-sm">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              Can I change my plan later?
            </summary>
            <p className="mt-3 text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately
              for upgrades, and at the end of your billing period for downgrades.
            </p>
          </details>
          
          <details className="bg-white rounded-lg p-6 shadow-sm">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              What happens if I run out of credits?
            </summary>
            <p className="mt-3 text-gray-600">
              If you run out of credits, you can purchase additional credits or upgrade your plan.
              Your projects will remain accessible, but you won't be able to make new API calls or
              generate new content until you add more credits.
            </p>
          </details>
          
          <details className="bg-white rounded-lg p-6 shadow-sm">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              Do unused credits roll over?
            </summary>
            <p className="mt-3 text-gray-600">
              It depends on your plan. Starter and higher plans support credit rollover up to a 
              specified limit. Free plan credits reset monthly.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
