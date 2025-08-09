import React from 'react';
import { Ship, Droplet, Gauge, Clock, AlertTriangle, Loader2, Fuel } from 'lucide-react';
import { useTerminalOperations } from '../../hooks/useTerminalOperations';
import type { TerminalId } from '../../types/api';
import { CargoScheduleTimeline } from './CargoScheduleTimeline';
import { InventoryStatus } from './InventoryStatus';

interface TerminalOperationsProps {
  terminalId: TerminalId;
}

const terminalColors = {
  'bonny': 'border-blue-500 text-blue-500',
  'forcados': 'border-green-500 text-green-500',
  'sea-eagle': 'border-teal-500 text-teal-500'
} as const;

const terminalNames = {
  'bonny': 'Bonny Terminal',
  'forcados': 'Forcados Terminal',
  'sea-eagle': 'Sea Eagle Terminal'
} as const;

export const TerminalOperations: React.FC<TerminalOperationsProps> = ({ terminalId }) => {
  const { data: operations, isLoading, error } = useTerminalOperations(terminalId);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !operations) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Unable to Load Terminal Operations
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {error?.message || 'Failed to fetch terminal data'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Terminal Header */}
      <div className={`flex items-center justify-between p-4 border-2 rounded-xl ${terminalColors[terminalId]}`}>
        <div className="flex items-center space-x-4">
          <Ship className={`h-8 w-8 ${terminalColors[terminalId]}`} />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {terminalNames[terminalId]}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {operations.terminal.status === 'operational' ? 'Operational' : 
               operations.terminal.status === 'maintenance' ? 'Under Maintenance' : 'Shutdown'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            operations.terminal.status === 'operational' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' :
            operations.terminal.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' :
            'bg-red-100 text-red-800 dark:bg-red-900/30'
          }`}>
            {operations.terminal.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Terminal KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Gauge className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Capacity</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {operations.kpis.capacityMillionBbl.toFixed(2)}M bbl
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Droplet className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Gross Stock</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {operations.kpis.grossStockMillionBbl.toFixed(2)}M bbl
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Fuel className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ready Crude</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {operations.kpis.readyCrudeKbpd.toLocaleString()} kbpd
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Fuel className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Production Rate</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {operations.kpis.productionRateKbpd.toLocaleString()} kbpd
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Endurance</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {operations.kpis.enduranceDays.toFixed(1)} days
          </div>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Storage Tanks Status
        </h3>
        <InventoryStatus tanks={operations.inventory.tanks} />
      </div>

      {/* Cargo Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cargo Schedule
        </h3>
        <CargoScheduleTimeline cargoes={operations.cargoSchedule} />
      </div>
    </div>
  );
}; 