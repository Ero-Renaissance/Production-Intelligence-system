import React from 'react';

export const OptimisationSimulation: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Optimisation & Simulation</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Programming & Technologist workspace (POC)</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <p className="text-gray-700 dark:text-gray-300 text-sm">Coming soon:</p>
        <ul className="list-disc ml-6 text-sm text-gray-700 dark:text-gray-300 mt-2">
          <li>Scenario setup and constraints</li>
          <li>Optimisation runs and result comparison</li>
          <li>Simulation model inputs/outputs</li>
        </ul>
      </div>
    </div>
  );
}; 