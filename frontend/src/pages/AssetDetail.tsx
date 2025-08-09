import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Droplet, Factory, Wind, Flame } from 'lucide-react';
import { useAssets } from '../hooks/useAssets';
import type { NetworkMetrics } from '../types/api';
import { GapDriversTable } from '../components/GapDrivers/GapDriversTable';
import { formatWithUnit } from '../utils/format';
import { TerminalsCompact } from '../components/Terminal/TerminalsCompact';
import { CargoScheduleTable } from '../components/CargoSchedule/CargoScheduleTable';

const HubNetworkCard: React.FC<{
  title: string;
  metrics?: NetworkMetrics;
  icon: React.ReactNode;
  color: { light: string; dark: string; text: string };
}> = ({ title, metrics, icon, color }) => {
  const getDefermentColor = (deferment: number, capacity: number) => {
    const pct = capacity > 0 ? (deferment / capacity) * 100 : 0;
    if (pct >= 20) return 'text-red-600 dark:text-red-400';
    if (pct >= 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border-l-4 ${color.light} dark:${color.dark}`}>
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <h4 className={`text-sm font-semibold ${color.text}`}>{title}</h4>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Max Capacity</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics ? formatWithUnit(metrics.maxCapacity, metrics.unit) : 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Business Target</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics ? formatWithUnit(metrics.businessTarget, metrics.unit) : 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Current Production</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics ? formatWithUnit(metrics.currentProduction, metrics.unit) : 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-600 dark:text-gray-400">Deferment</span>
          <span className={`text-sm font-medium ${metrics ? getDefermentColor(metrics.deferment, metrics.maxCapacity) : 'text-gray-400'}`}>{metrics ? formatWithUnit(metrics.deferment, metrics.unit) : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export const AssetDetail: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAssets();

  // Validate assetId
  if (assetId !== 'east' && assetId !== 'west') {
    return (
      <div className="text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Invalid Asset
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This asset does not exist
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Unable to load asset data
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error?.message || 'Failed to fetch asset data'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const asset = data.assets.find(a => a.id === assetId)!;

  return (
    <div className="space-y-6">
      {/* Sticky Header with Breadcrumbs */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <nav aria-label="Breadcrumb" className="text-sm text-gray-600 dark:text-gray-300">
              <ol className="flex items-center gap-2">
                <li>
                  <Link to="/" className="hover:underline">Home</Link>
                </li>
                <li className="opacity-60">/</li>
                <li aria-current="page" className="font-medium text-gray-900 dark:text-white">
                  {assetId === 'east' ? 'East Asset' : 'West Asset'}
                </li>
              </ol>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              asset.status === 'normal' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {asset.status.toUpperCase()}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {asset.summary.activeUnits}/{asset.summary.totalUnits} Units Active
            </span>
          </div>
        </div>
      </div>

      {/* Production Hubs (Per-hub KPI cards) */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Production Hubs</h2>
        {asset.productionUnits.map(unit => (
          <div key={unit.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{unit.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last updated {new Date(unit.lastUpdated).toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  unit.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  unit.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {unit.status.toUpperCase()}
                </span>
                <button
                  onClick={() => navigate(`/asset/${assetId}/hub/${unit.id}`)}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`View details for ${unit.name}`}
                >
                  View Details
                </button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <HubNetworkCard
                title="Oil"
                metrics={unit.networks.oil}
                icon={<Droplet className="h-5 w-5 text-blue-500" />}
                color={{ light: 'border-blue-500', dark: 'border-blue-400', text: 'text-blue-500 dark:text-blue-400' }}
              />
              <HubNetworkCard
                title="Domestic Gas"
                metrics={unit.networks.domesticGas}
                icon={<Factory className="h-5 w-5 text-green-500" />}
                color={{ light: 'border-green-500', dark: 'border-green-400', text: 'text-green-500 dark:text-green-400' }}
              />
              <HubNetworkCard
                title="Export Gas"
                metrics={unit.networks.exportGas}
                icon={<Wind className="h-5 w-5 text-purple-500" />}
                color={{ light: 'border-purple-500', dark: 'border-purple-400', text: 'text-purple-500 dark:text-purple-400' }}
              />
              <HubNetworkCard
                title="Flared Gas"
                metrics={unit.networks.flaredGas}
                icon={<Flame className="h-5 w-5 text-orange-500" />}
                color={{ light: 'border-orange-500', dark: 'border-orange-400', text: 'text-orange-500 dark:text-orange-400' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Gap Drivers scoped to this asset */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6">
          <GapDriversTable assetId={assetId as 'east' | 'west'} enableFiltering={true} showDetailedImpact={true} maxRows={5} />
        </div>
      </div>

      {/* Terminals Overview (Compact) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terminals Overview</h2>
          <p className="text-gray-600 dark:text-gray-400">Key KPIs for terminals in this asset</p>
        </div>
        <div className="p-6">
          <TerminalsCompact assetId={assetId as 'east' | 'west'} />
        </div>
      </div>

      {/* Upcoming Cargo Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Cargo Schedule</h2>
          <p className="text-gray-600 dark:text-gray-400">Consolidated view of scheduled cargo</p>
        </div>
        <div className="p-6">
          <CargoScheduleTable assetId={assetId as 'east' | 'west'} />
        </div>
      </div>
    </div>
  );
}; 