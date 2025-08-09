import React from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Droplet, Factory, Wind, Flame } from 'lucide-react';
import { useAssets } from '../hooks/useAssets';
import type { NetworkMetrics } from '../types/api';
import { GapDriversTable } from '../components/GapDrivers/GapDriversTable';
import { TerminalsCompact } from '../components/Terminal/TerminalsCompact';
import { CargoScheduleTable } from '../components/CargoSchedule/CargoScheduleTable';
import { formatWithUnit } from '../utils/format';
import { WellsTable } from '../components/Wells/WellsTable';

const MetricRow: React.FC<{ label: string; value?: number; unit?: string }> = ({ label, value, unit }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-white">{typeof value === 'number' ? formatWithUnit(value, unit) : '—'}</span>
  </div>
);

export const FacilityDetail: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error } = useAssets();

  // Initialize network filter from URL -> localStorage -> undefined
  const urlNetwork = searchParams.get('network') as 'oil' | 'domesticGas' | 'exportGas' | null;
  const localStorageKey = React.useMemo(() => (facilityId ? `facilityNetworkFilter:${facilityId}` : 'facilityNetworkFilter'), [facilityId]);
  const storedNetwork = (typeof window !== 'undefined' ? (localStorage.getItem(localStorageKey) as 'oil' | 'domesticGas' | 'exportGas' | null) : null);
  const initialNetwork: 'oil' | 'domesticGas' | 'exportGas' | undefined = urlNetwork ?? storedNetwork ?? undefined;
  const [networkFilter, setNetworkFilter] = React.useState<'oil' | 'domesticGas' | 'exportGas' | undefined>(initialNetwork);

  // Sync URL and localStorage when filter changes
  React.useEffect(() => {
    if (!facilityId) return;
    const params = new URLSearchParams(searchParams);
    if (networkFilter) params.set('network', networkFilter); else params.delete('network');
    setSearchParams(params, { replace: true });
    try {
      if (networkFilter) localStorage.setItem(localStorageKey, networkFilter); else localStorage.removeItem(localStorageKey);
    } catch (_err) {
      // Ignore storage errors (e.g., private mode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkFilter, facilityId]);

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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Unable to load facility</h3>
        <button onClick={() => navigate('/')} className="text-blue-500">Back</button>
      </div>
    );
  }

  // Locate facility and context
  let assetId: 'east' | 'west' | undefined;
  let unitName: string | undefined;
  let facility: { id: string; type: 'flowstation' | 'compressor-station' | 'gas-plant' | 'terminal'; networks: { oil?: NetworkMetrics; domesticGas?: NetworkMetrics; exportGas?: NetworkMetrics; flaredGas?: NetworkMetrics } } | undefined;
  const asset = data.assets.find(a => a.productionUnits.some(u => u.facilities.some(f => f.id === facilityId)));
  if (asset) {
    assetId = asset.id;
    const unit = asset.productionUnits.find(u => u.facilities.some(f => f.id === facilityId));
    unitName = unit?.name;
    type FacilityRef = { id: string; type: 'flowstation' | 'compressor-station' | 'gas-plant' | 'terminal'; networks: { oil?: NetworkMetrics; domesticGas?: NetworkMetrics; exportGas?: NetworkMetrics; flaredGas?: NetworkMetrics } };
    facility = unit?.facilities.find(f => f.id === facilityId) as FacilityRef | undefined;
  }

  if (!facility || !assetId) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Facility not found</h3>
        <button onClick={() => navigate('/')} className="text-blue-500">Back</button>
      </div>
    );
  }

  const isTerminal = facility.type === 'terminal';
  const facilityDisplay = `${facility.type.replace('-', ' ')}-${facility.id.split('-').slice(-1)[0]}`;

  return (
    <div className="space-y-6">
      {/* Sticky Header with Breadcrumbs */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <nav aria-label="Breadcrumb" className="text-sm text-gray-600 dark:text-gray-300">
              <ol className="flex items-center gap-2">
                <li>
                  <Link to="/" className="hover:underline">Home</Link>
                </li>
                <li className="opacity-60">/</li>
                <li>
                  <Link to={`/asset/${assetId}`} className="hover:underline">{assetId === 'east' ? 'East Asset' : 'West Asset'}</Link>
                </li>
                <li className="opacity-60">/</li>
                <li aria-current="page" className="font-medium text-gray-900 dark:text-white">{unitName}: {facilityDisplay}</li>
              </ol>
            </nav>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">Type: {facility.type.replace('-', ' ')}</div>
        </div>
      </div>

      {/* KPIs per network */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-blue-500">
            <div className="flex items-center space-x-2 mb-2 text-blue-600 dark:text-blue-400"><Droplet className="h-4 w-4" /><span className="text-sm font-semibold">Oil</span></div>
            <MetricRow label="Max Capacity" value={facility.networks?.oil?.maxCapacity} unit={facility.networks?.oil?.unit} />
            <MetricRow label="Business Target" value={facility.networks?.oil?.businessTarget} unit={facility.networks?.oil?.unit} />
            <MetricRow label="Current Production" value={facility.networks?.oil?.currentProduction} unit={facility.networks?.oil?.unit} />
            <MetricRow label="Deferment" value={facility.networks?.oil?.deferment} unit={facility.networks?.oil?.unit} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-green-500">
            <div className="flex items-center space-x-2 mb-2 text-green-600 dark:text-green-400"><Factory className="h-4 w-4" /><span className="text-sm font-semibold">Domestic Gas</span></div>
            <MetricRow label="Max Capacity" value={facility.networks?.domesticGas?.maxCapacity} unit={facility.networks?.domesticGas?.unit} />
            <MetricRow label="Business Target" value={facility.networks?.domesticGas?.businessTarget} unit={facility.networks?.domesticGas?.unit} />
            <MetricRow label="Current Production" value={facility.networks?.domesticGas?.currentProduction} unit={facility.networks?.domesticGas?.unit} />
            <MetricRow label="Deferment" value={facility.networks?.domesticGas?.deferment} unit={facility.networks?.domesticGas?.unit} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-purple-500">
            <div className="flex items-center space-x-2 mb-2 text-purple-600 dark:text-purple-400"><Wind className="h-4 w-4" /><span className="text-sm font-semibold">Export Gas</span></div>
            <MetricRow label="Max Capacity" value={facility.networks?.exportGas?.maxCapacity} unit={facility.networks?.exportGas?.unit} />
            <MetricRow label="Business Target" value={facility.networks?.exportGas?.businessTarget} unit={facility.networks?.exportGas?.unit} />
            <MetricRow label="Current Production" value={facility.networks?.exportGas?.currentProduction} unit={facility.networks?.exportGas?.unit} />
            <MetricRow label="Deferment" value={facility.networks?.exportGas?.deferment} unit={facility.networks?.exportGas?.unit} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-orange-500">
            <div className="flex items-center space-x-2 mb-2 text-orange-600 dark:text-orange-400"><Flame className="h-4 w-4" /><span className="text-sm font-semibold">Flared Gas</span></div>
            <MetricRow label="Max Capacity" value={facility.networks?.flaredGas?.maxCapacity} unit={facility.networks?.flaredGas?.unit} />
            <MetricRow label="Business Target" value={facility.networks?.flaredGas?.businessTarget} unit={facility.networks?.flaredGas?.unit} />
            <MetricRow label="Current Production" value={facility.networks?.flaredGas?.currentProduction} unit={facility.networks?.flaredGas?.unit} />
            <MetricRow label="Deferment" value={facility.networks?.flaredGas?.deferment} unit={facility.networks?.flaredGas?.unit} />
          </div>
        </div>
      </div>

      {/* Wells table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Wells</h2>
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setNetworkFilter(undefined)} className={`px-3 py-1 rounded border ${networkFilter===undefined? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>All</button>
            <button onClick={() => setNetworkFilter('oil')} className={`px-3 py-1 rounded border ${networkFilter==='oil'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>Oil</button>
            <button onClick={() => setNetworkFilter('domesticGas')} className={`px-3 py-1 rounded border ${networkFilter==='domesticGas'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>Domestic Gas</button>
            <button onClick={() => setNetworkFilter('exportGas')} className={`px-3 py-1 rounded border ${networkFilter==='exportGas'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>Export Gas</button>
          </div>
        </div>
        <div className="p-6">
          <WellsTable facilityId={facility.id} network={networkFilter} />
        </div>
      </div>

      {/* Production Gap Analysis (facility-scoped) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6">
          <GapDriversTable assetId={assetId} facilityId={facility.id} enableFiltering={true} showDetailedImpact={true} maxRows={5} />
        </div>
      </div>

      {/* Terminal Overview and Cargo (if terminal) */}
      {isTerminal && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terminal Overview</h2>
            </div>
            <div className="p-6">
              <TerminalsCompact assetId={assetId} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Cargo Schedule</h2>
            </div>
            <div className="p-6">
              <CargoScheduleTable assetId={assetId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
} 