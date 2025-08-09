/**
 * Node Detail Page Component
 * Following TRS Section 5 specifications and Phase 3 implementation plan
 * 
 * Features per TRS Section 5:
 * - Header KPIs for the selected node
 * - Trend chart visualization
 * - Issues list and constraint management
 * - Optimization tab with AI recommendations
 * - Real-time data updates
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, AlertTriangle, TrendingUp, Gauge, Droplets, Zap } from 'lucide-react';

/**
 * Node detail page - skeleton implementation for Phase 3
 * Will be enhanced in Phase 5 with real data fetching and visualization
 */
export const NodeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'issues' | 'optimization'>('overview');

  // Mock node data - will be replaced with real API calls in Phase 4
  const nodeData = {
    id: id || 'unknown',
    name: id === 'well-001' ? 'Alpha-7 Production Well' : `Node ${id}`,
    type: 'well',
    status: 'active',
    constraintLevel: 'normal' as const
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'trends', label: 'Trends', icon: TrendingUp },
    { key: 'issues', label: 'Issues', icon: AlertTriangle },
    { key: 'optimization', label: 'Optimization', icon: Zap }
  ];

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb and node info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div>
            <nav className="flex text-sm text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-gray-700 dark:hover:text-gray-200">
                Dashboard
              </button>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-white">Node Detail</span>
            </nav>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {nodeData.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1)} • ID: {nodeData.id}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            Online
          </span>
        </div>
      </div>

      {/* Header KPIs - as specified in TRS Section 5 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Throughput</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2,850</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">bbl/day</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">89.1%</p>
              <p className="text-xs text-green-600 dark:text-green-400">+2.3%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-oil-100 dark:bg-oil-900 rounded-lg">
              <Droplets className="h-6 w-6 text-oil-600 dark:text-oil-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Oil Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2,850</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">bbl/day</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-exportgas-100 dark:bg-exportgas-900 rounded-lg">
              <Zap className="h-6 w-6 text-exportgas-600 dark:text-exportgas-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gas Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,200</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">mcf/day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'overview' | 'trends' | 'issues' | 'optimization')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Node Overview</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Node overview content (Phase 5A)
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Analysis</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Trend chart component (Phase 5A)
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Issues & Constraints</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Issues list component (Phase 5A)
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Optimization</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Optimization tab component (Phase 5B)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 