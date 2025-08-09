/**
 * SummaryStats Component
 * TRS Section 5: KPI cards with large numerics & ▲▼ arrows vs previous period
 * 
 * Features:
 * - Large numeric displays for key production metrics
 * - Trend indicators with up/down arrows
 * - Previous period comparison
 * - Asset-level breakdown (East vs West)
 * - Real-time updates via React Query
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Droplet, Wind, Factory, Flame } from 'lucide-react';
import { useSummary } from '../../hooks/useSummary';
import type { NetworkMetrics } from '../../types/api';
import { TimeframeSelector, type Timeframe } from '../TimeframeSelector/TimeframeSelector';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/axios';

interface SummaryStatsProps {
  onAssetClick: (assetId: 'east' | 'west') => void;
}

interface NetworkCardProps {
  title: string;
  metrics?: NetworkMetrics;
  icon: React.ReactNode;
  color: {
    light: string;
    dark: string;
    text: string;
  };
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <span className="h-4 w-4 inline-block text-gray-400">—</span>;
};

const NetworkCard: React.FC<NetworkCardProps> = ({ title, metrics, icon, color }) => {
  const getDefermentColor = (deferment: number, capacity: number) => {
    const defermentPercent = (deferment / capacity) * 100;
    if (defermentPercent >= 20) return 'text-red-600 dark:text-red-400';
    if (defermentPercent >= 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border-l-4 ${color.light} dark:${color.dark}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className={`text-sm font-semibold ${color.text}`}>
            {title}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {metrics ? (
            <>
              {getTrendIcon(metrics.trend)}
              <span className={`${metrics.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-xs`}>
                {Math.abs(metrics.changePercent)}%
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400">N/A</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Max Capacity */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Max Capacity</span>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics ? `${metrics.maxCapacity.toLocaleString()} ${metrics.unit}` : '—'}
            </span>
          </div>
        </div>

        {/* Business Target */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Business Target</span>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics ? `${metrics.businessTarget.toLocaleString()} ${metrics.unit}` : '—'}
            </span>
          </div>
        </div>

        {/* Current Production */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Current Production</span>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics ? `${metrics.currentProduction.toLocaleString()} ${metrics.unit}` : '—'}
            </span>
          </div>
        </div>

        {/* Deferment */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-600 dark:text-gray-400">Deferment</span>
          <div className="text-right">
            <span className={`text-sm font-medium ${metrics ? getDefermentColor(metrics.deferment, metrics.maxCapacity) : 'text-gray-400'}`}>
              {metrics ? `${metrics.deferment.toLocaleString()} ${metrics.unit}` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SummaryStats: React.FC<SummaryStatsProps> = ({ onAssetClick }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('mtd');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | undefined>();
  const { data, isLoading, error } = useSummary({ timeframe, customRange });
  const queryClient = useQueryClient();

  const prefetchAssets = async () => {
    await queryClient.prefetchQuery({
      queryKey: ['assets', { period: '24h', includeUnits: true }],
      queryFn: async () => {
        const res = await apiClient.get('/assets');
        return res.data;
      },
      staleTime: 30000,
    });
  };

  const handleTimeframeChange = (newTimeframe: Timeframe, newCustomRange?: { start: Date; end: Date }) => {
    setTimeframe(newTimeframe);
    setCustomRange(newCustomRange);
    // Here we would typically refetch data with new timeframe
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Unable to Load System Overview
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error?.message || 'Failed to fetch summary data'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <TimeframeSelector
          value={timeframe}
          customRange={customRange}
          onChange={handleTimeframeChange}
        />
      </div>

      {/* East Asset  */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              East Asset
            </h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              data.assets.east.status === 'normal' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {data.assets.east.status.toUpperCase()}
            </span>
          </div>
          <button
            onMouseEnter={prefetchAssets}
            onClick={() => onAssetClick('east')}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="View East Asset Details"
          >
            View Details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NetworkCard
            title="Oil Network"
            metrics={data.assets.east.networks.oil}
            icon={<Droplet className="h-5 w-5 text-blue-500" />}
            color={{
              light: 'border-blue-500',
              dark: 'border-blue-400',
              text: 'text-blue-500 dark:text-blue-400'
            }}
          />
          <NetworkCard
            title="Domestic Gas"
            metrics={data.assets.east.networks.domesticGas}
            icon={<Factory className="h-5 w-5 text-green-500" />}
            color={{
              light: 'border-green-500',
              dark: 'border-green-400',
              text: 'text-green-500 dark:text-green-400'
            }}
          />
          <NetworkCard
            title="Export Gas"
            metrics={data.assets.east.networks.exportGas}
            icon={<Wind className="h-5 w-5 text-purple-500" />}
            color={{
              light: 'border-purple-500',
              dark: 'border-purple-400',
              text: 'text-purple-500 dark:text-purple-400'
            }}
          />
          <NetworkCard
            title="Flared Gas"
            metrics={data.assets.east.networks.flaredGas}
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            color={{
              light: 'border-orange-500',
              dark: 'border-orange-400',
              text: 'text-orange-500 dark:text-orange-400'
            }}
          />
        </div>
      </div>

      {/* West Asset */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              West Asset
            </h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              data.assets.west.status === 'normal' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {data.assets.west.status.toUpperCase()}
            </span>
          </div>
          <button
            onMouseEnter={prefetchAssets}
            onClick={() => onAssetClick('west')}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="View West Asset Details"
          >
            View Details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NetworkCard
            title="Oil Network"
            metrics={data.assets.west.networks.oil}
            icon={<Droplet className="h-5 w-5 text-blue-500" />}
            color={{
              light: 'border-blue-500',
              dark: 'border-blue-400',
              text: 'text-blue-500 dark:text-blue-400'
            }}
          />
          <NetworkCard
            title="Domestic Gas"
            metrics={data.assets.west.networks.domesticGas}
            icon={<Factory className="h-5 w-5 text-green-500" />}
            color={{
              light: 'border-green-500',
              dark: 'border-green-400',
              text: 'text-green-500 dark:text-green-400'
            }}
          />
          <NetworkCard
            title="Export Gas"
            metrics={data.assets.west.networks.exportGas}
            icon={<Wind className="h-5 w-5 text-purple-500" />}
            color={{
              light: 'border-purple-500',
              dark: 'border-purple-400',
              text: 'text-purple-500 dark:text-purple-400'
            }}
          />
          <NetworkCard
            title="Flared Gas"
            metrics={data.assets.west.networks.flaredGas}
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            color={{
              light: 'border-orange-500',
              dark: 'border-orange-400',
              text: 'text-orange-500 dark:text-orange-400'
            }}
          />
        </div>
      </div>
    </div>
  );
}; 