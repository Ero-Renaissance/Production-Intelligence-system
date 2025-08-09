import React from 'react';
import { useTerminalOperations } from '../../hooks/useTerminalOperations';
import { Gauge, Battery, Flame, Activity, Clock, AlertCircle } from 'lucide-react';

const terminals = [
  { id: 'bonny', name: 'Bonny', asset: 'east' as const },
  { id: 'forcados', name: 'Forcados', asset: 'west' as const },
  { id: 'sea-eagle', name: 'Sea Eagle', asset: 'west' as const },
] as const;

export const TerminalsCompact: React.FC<{ assetId?: 'east' | 'west' }> = ({ assetId }) => {
  const bonny = useTerminalOperations('bonny');
  const forcados = useTerminalOperations('forcados');
  const seaEagle = useTerminalOperations('sea-eagle');

  const loading = bonny.isLoading || forcados.isLoading || seaEagle.isLoading;
  const anyError = bonny.error || forcados.error || seaEagle.error;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (anyError) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Unable to Load Terminal KPIs</h3>
        <p className="text-gray-600 dark:text-gray-400">Please try again later</p>
      </div>
    );
  }

  const dataMap = {
    bonny: bonny.data!,
    forcados: forcados.data!,
    'sea-eagle': seaEagle.data!,
  } as const;

  const visible = assetId ? terminals.filter(t => t.asset === assetId) : terminals;
  const few = visible.length < 3;
  const containerClass = few ? 'flex flex-wrap justify-center gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4';

  return (
    <div className={containerClass}>
      {visible.map(t => {
        const data = dataMap[t.id];
        if (!data) return null;
        const { kpis } = data;
        return (
          <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 w-full md:w-96">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.name} Terminal</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t.asset === 'east' ? 'East' : 'West'} Asset</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                data.terminal.status === 'operational' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                data.terminal.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {data.terminal.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Gauge className="h-4 w-4 mr-1.5" />
                  <span>Max Capacity</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{kpis.capacityMillionBbl.toFixed(2)}M bbl</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Battery className="h-4 w-4 mr-1.5" />
                  <span>Gross Stock</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{kpis.grossStockMillionBbl.toFixed(2)}M bbl</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Flame className="h-4 w-4 mr-1.5" />
                  <span>Ready Crude</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{kpis.readyCrudeKbpd.toLocaleString()} kbpd</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Activity className="h-4 w-4 mr-1.5" />
                  <span>Production Rate</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{kpis.productionRateKbpd.toLocaleString()} kbpd</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1.5" />
                  <span>Endurance</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{kpis.enduranceDays} days</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 