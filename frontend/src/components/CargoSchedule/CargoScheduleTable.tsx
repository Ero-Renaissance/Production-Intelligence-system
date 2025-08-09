import React, { useMemo } from 'react';
import { Ship, Calendar, Droplet, Clock, AlertCircle } from 'lucide-react';
import { useTerminalOperations } from '../../hooks/useTerminalOperations';

const terminalNames = {
  'bonny': 'Bonny Terminal (East)',
  'forcados': 'Forcados Terminal (West)',
  'sea-eagle': 'Sea Eagle Terminal (West)'
} as const;

export const CargoScheduleTable: React.FC<{ assetId?: 'east' | 'west'; terminalId?: 'bonny' | 'forcados' | 'sea-eagle' }> = ({ assetId, terminalId }) => {
  // Fetch data from all terminals
  const bonny = useTerminalOperations('bonny');
  const forcados = useTerminalOperations('forcados');
  const seaEagle = useTerminalOperations('sea-eagle');

  type DisplayCargo = {
    id: string;
    vesselName: string;
    scheduledDate: string;
    cargoSize: number;
    status: 'scheduled' | 'loading' | 'completed';
    destination: string;
    terminalName: string;
    terminalInventory: number;
    terminalId: 'bonny' | 'forcados' | 'sea-eagle';
  };

  // Combine and sort all cargo schedules
  const allCargoes = useMemo(() => {
    const cargoes: DisplayCargo[] = [];

    const includeBonny = (!assetId || assetId === 'east') && (!terminalId || terminalId === 'bonny');
    const includeForcados = (!assetId || assetId === 'west') && (!terminalId || terminalId === 'forcados');
    const includeSeaEagle = (!assetId || assetId === 'west') && (!terminalId || terminalId === 'sea-eagle');

    if (includeBonny && bonny.data) {
      cargoes.push(
        ...bonny.data.cargoSchedule.map(c => ({
          id: c.id,
          vesselName: c.vesselName,
          scheduledDate: c.scheduledDate,
          cargoSize: c.cargoSize,
          status: c.status,
          destination: c.destination,
          terminalName: terminalNames.bonny,
          terminalInventory: bonny.data.inventory.current,
          terminalId: 'bonny' as const,
        }))
      );
    }

    if (includeForcados && forcados.data) {
      cargoes.push(
        ...forcados.data.cargoSchedule.map(c => ({
          id: c.id,
          vesselName: c.vesselName,
          scheduledDate: c.scheduledDate,
          cargoSize: c.cargoSize,
          status: c.status,
          destination: c.destination,
          terminalName: terminalNames.forcados,
          terminalInventory: forcados.data.inventory.current,
          terminalId: 'forcados' as const,
        }))
      );
    }

    if (includeSeaEagle && seaEagle.data) {
      cargoes.push(
        ...seaEagle.data.cargoSchedule.map(c => ({
          id: c.id,
          vesselName: c.vesselName,
          scheduledDate: c.scheduledDate,
          cargoSize: c.cargoSize,
          status: c.status,
          destination: c.destination,
          terminalName: terminalNames['sea-eagle'],
          terminalInventory: seaEagle.data.inventory.current,
          terminalId: 'sea-eagle' as const,
        }))
      );
    }

    return cargoes.sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  }, [bonny.data, forcados.data, seaEagle.data, assetId, terminalId]);

  // Calculate days until cargo
  const getDaysUntil = (date: string) => {
    const days = Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  // Loading states
  if (bonny.isLoading || forcados.isLoading || seaEagle.isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error states
  if (bonny.error || forcados.error || seaEagle.error) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Unable to Load Cargo Schedules
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please try again later
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Vessel & Terminal
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Schedule
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cargo Details
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {allCargoes.map(cargo => {
            const daysUntil = getDaysUntil(cargo.scheduledDate);
            const inventoryGap = cargo.cargoSize - cargo.terminalInventory;
            const isInventoryReady = cargo.terminalInventory >= cargo.cargoSize;
            
            return (
              <tr key={cargo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Ship className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {cargo.vesselName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cargo.terminalName}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(cargo.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        in {daysUntil} days
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Droplet className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {(cargo.cargoSize / 1000).toFixed(1)}k bbls required
                      </div>
                      <div className={`text-sm ${isInventoryReady ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isInventoryReady 
                          ? `${((cargo.terminalInventory - cargo.cargoSize) / 1000).toFixed(1)}k bbls surplus`
                          : `${(Math.abs(inventoryGap) / 1000).toFixed(1)}k bbls shortfall`
                        }
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cargo.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        cargo.status === 'loading' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {cargo.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 