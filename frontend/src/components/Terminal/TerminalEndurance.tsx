import React from 'react';
import { useTerminalOperations } from '../../hooks/useTerminalOperations';
import { Battery, AlertCircle, Loader2 } from 'lucide-react';

const terminals = [
  { id: 'bonny', name: 'Bonny Terminal', asset: 'East' },
  { id: 'forcados', name: 'Forcados Terminal', asset: 'West' },
  { id: 'sea-eagle', name: 'Sea Eagle Terminal', asset: 'West' }
] as const;

export const TerminalEndurance: React.FC = () => {
  // Fetch data for all terminals
  const bonny = useTerminalOperations('bonny');
  const forcados = useTerminalOperations('forcados');
  const seaEagle = useTerminalOperations('sea-eagle');

  // Loading state
  if (bonny.isLoading || forcados.isLoading || seaEagle.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        ))}
      </div>
    );
  }

  // Error state
  if (bonny.error || forcados.error || seaEagle.error) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Unable to Load Terminal Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please try again later
        </p>
      </div>
    );
  }

  // Endurance status color helper
  const getEnduranceColor = (days: number) => {
    if (days <= 5) return 'text-red-500 dark:text-red-400';
    if (days <= 10) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {terminals.map(terminal => {
        const data = {
          bonny: bonny.data,
          forcados: forcados.data,
          'sea-eagle': seaEagle.data
        }[terminal.id];

        if (!data) return null;

        const enduranceDays = data.kpis.enduranceDays;

        return (
          <div key={terminal.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {terminal.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {terminal.asset} Asset
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                data.terminal.status === 'operational' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                data.terminal.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {data.terminal.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              {/* Gross Stock / Operating Capacity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Battery className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Gross Stock
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.kpis.grossStockMillionBbl.toFixed(2)}M bbl / {data.kpis.capacityMillionBbl.toFixed(2)}M bbl
                  </div>
                </div>
              </div>

              {/* Production Rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Production Rate
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.kpis.productionRateKbpd.toLocaleString()} kbpd
                  </div>
                </div>
              </div>

              {/* Endurance */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Endurance
                </span>
                <div className={`text-lg font-bold ${getEnduranceColor(enduranceDays)}`}>
                  {enduranceDays} days
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 