/**
 * API Integrations Dashboard
 * 
 * Manage data source integrations and execute queries
 */

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "~/convex/_generated/api";
import type { Id } from "~/convex/_generated/dataModel";

interface IntegrationsDashboardProps {
  memberId: Id<"convexMembers">;
}

type Provider = 
  | "rest_api"
  | "graphql"
  | "postgres"
  | "mysql"
  | "mongodb"
  | "airtable"
  | "google_sheets"
  | "stripe"
  | "salesforce"
  | "hubspot"
  | "shopify"
  | "firebase"
  | "supabase"
  | "custom";

const PROVIDER_INFO: Record<Provider, { name: string; icon: string; description: string }> = {
  rest_api: { name: "REST API", icon: "🔗", description: "Connect to any REST API" },
  graphql: { name: "GraphQL", icon: "⚡", description: "Query GraphQL endpoints" },
  postgres: { name: "PostgreSQL", icon: "🐘", description: "Connect to PostgreSQL databases" },
  mysql: { name: "MySQL", icon: "🐬", description: "Connect to MySQL databases" },
  mongodb: { name: "MongoDB", icon: "🍃", description: "Connect to MongoDB collections" },
  airtable: { name: "Airtable", icon: "📊", description: "Access Airtable bases" },
  google_sheets: { name: "Google Sheets", icon: "📈", description: "Import Google Sheets data" },
  stripe: { name: "Stripe", icon: "💳", description: "Access Stripe payment data" },
  salesforce: { name: "Salesforce", icon: "☁️", description: "Connect to Salesforce CRM" },
  hubspot: { name: "HubSpot", icon: "🎯", description: "Access HubSpot data" },
  shopify: { name: "Shopify", icon: "🛍️", description: "Connect to Shopify stores" },
  firebase: { name: "Firebase", icon: "🔥", description: "Access Firebase services" },
  supabase: { name: "Supabase", icon: "⚡", description: "Connect to Supabase projects" },
  custom: { name: "Custom", icon: "🔧", description: "Custom integration" },
};

export function IntegrationsDashboard({ memberId }: IntegrationsDashboardProps) {
  const [showNewIntegration, setShowNewIntegration] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Id<"apiIntegrations"> | null>(null);
  
  const integrations = useQuery(api.apiIntegrations.getApiIntegrations, { 
    memberId,
    status: "active" 
  });
  
  const allIntegrations = useQuery(api.apiIntegrations.getApiIntegrations, { 
    memberId 
  });
  
  const testIntegration = useAction(api.apiIntegrations.testApiIntegration);
  const deleteIntegration = useMutation(api.apiIntegrations.deleteApiIntegration);
  
  const handleTestConnection = async (integrationId: Id<"apiIntegrations">) => {
    try {
      const result = await testIntegration({ integrationId, memberId });
      if (result.success) {
        alert("Connection successful!");
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleDeleteIntegration = async (integrationId: Id<"apiIntegrations">) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this integration? This action cannot be undone."
    );
    
    if (confirmed) {
      try {
        await deleteIntegration({ integrationId, memberId });
        alert("Integration deleted successfully");
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      }
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect to external data sources and APIs
          </p>
        </div>
        <button
          onClick={() => setShowNewIntegration(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + New Integration
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Integrations</div>
          <div className="text-2xl font-bold text-gray-900">
            {allIntegrations?.length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {integrations?.length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Requests</div>
          <div className="text-2xl font-bold text-blue-600">
            {allIntegrations?.reduce((sum, i) => sum + i.totalRequests, 0) || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Failed Requests</div>
          <div className="text-2xl font-bold text-red-600">
            {allIntegrations?.reduce((sum, i) => sum + i.failedRequests, 0) || 0}
          </div>
        </div>
      </div>
      
      {/* Available Providers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Data Sources
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(Object.entries(PROVIDER_INFO) as [Provider, typeof PROVIDER_INFO[Provider]][]).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setShowNewIntegration(true)}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="text-3xl mb-2">{info.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center">
                {info.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Active Integrations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Your Integrations
        </h2>
        
        {!integrations || integrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No integrations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Connect your first data source to start building data-driven apps
            </p>
            <button
              onClick={() => setShowNewIntegration(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Integration
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => {
              const providerInfo = PROVIDER_INFO[integration.provider];
              
              return (
                <div
                  key={integration._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-4xl">{providerInfo.icon}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {integration.name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            integration.status === "active" ? "bg-green-100 text-green-800" :
                            integration.status === "testing" ? "bg-yellow-100 text-yellow-800" :
                            integration.status === "error" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {integration.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {providerInfo.name} • {providerInfo.description}
                        </p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{integration.totalRequests}</span> requests
                          </div>
                          {integration.failedRequests > 0 && (
                            <div className="text-red-600">
                              <span className="font-medium">{integration.failedRequests}</span> failures
                            </div>
                          )}
                          {integration.lastUsedAt && (
                            <div>
                              Last used: {new Date(integration.lastUsedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        {integration.lastErrorMessage && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                            Error: {integration.lastErrorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestConnection(integration._id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
                      >
                        Test
                      </button>
                      
                      <button
                        onClick={() => setSelectedIntegration(integration._id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Manage
                      </button>
                      
                      <button
                        onClick={() => handleDeleteIntegration(integration._id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Usage Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🚀 How to use integrations in your apps
        </h3>
        
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>1. Connect:</strong> Add your data source credentials above
          </p>
          <p>
            <strong>2. Query:</strong> Create saved queries or execute ad-hoc requests
          </p>
          <p>
            <strong>3. Build:</strong> Use the data in your AI-powered apps
          </p>
        </div>
        
        <button
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
          onClick={() => window.open("/docs/integrations", "_blank")}
        >
          View Documentation →
        </button>
      </div>
      
      {/* New Integration Modal */}
      {showNewIntegration && (
        <NewIntegrationModal
          memberId={memberId}
          onClose={() => setShowNewIntegration(false)}
        />
      )}
      
      {/* Integration Details Modal */}
      {selectedIntegration && (
        <IntegrationDetailsModal
          memberId={memberId}
          integrationId={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  );
}

// Placeholder modals (to be implemented)
function NewIntegrationModal({ memberId, onClose }: { 
  memberId: Id<"convexMembers">; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">New Integration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Select a provider and configure your connection settings.
        </p>
        
        {/* Integration form would go here */}
        <div className="text-center py-8 text-gray-500">
          Integration configuration form to be implemented
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Integration
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationDetailsModal({ 
  memberId, 
  integrationId, 
  onClose 
}: { 
  memberId: Id<"convexMembers">; 
  integrationId: Id<"apiIntegrations">; 
  onClose: () => void;
}) {
  const integration = useQuery(api.apiIntegrations.getApiIntegration, {
    integrationId,
    memberId,
  });
  
  const queries = useQuery(api.apiIntegrations.getApiQueries, {
    integrationId,
    memberId,
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{integration?.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Queries list */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Saved Queries</h3>
          {!queries || queries.length === 0 ? (
            <p className="text-gray-500">No saved queries yet</p>
          ) : (
            <div className="space-y-2">
              {queries.map((query) => (
                <div key={query._id} className="border rounded p-3">
                  <div className="font-medium">{query.name}</div>
                  <div className="text-sm text-gray-600">{query.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
