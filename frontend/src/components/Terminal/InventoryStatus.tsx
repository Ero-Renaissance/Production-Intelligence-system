import React from 'react';
import { Database } from 'lucide-react';

interface Tank {
  id: string;
  name: string;
  capacity: number;
  currentLevel: number;
  status: 'in-service' | 'maintenance' | 'offline';
}

interface InventoryStatusProps {
  tanks: Tank[];
}

export const InventoryStatus: React.FC<InventoryStatusProps> = ({ tanks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tanks.map(tank => {
        const utilizationPercent = (tank.currentLevel / tank.capacity) * 100;
        
        return (
          <div key={tank.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {tank.name}
                </span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                tank.status === 'in-service' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                tank.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {tank.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>

            {/* Level Bar */}
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full ${
                  utilizationPercent > 90 ? 'bg-red-500' :
                  utilizationPercent > 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${utilizationPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {(tank.currentLevel / 1000).toFixed(1)}k bbls
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {utilizationPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 