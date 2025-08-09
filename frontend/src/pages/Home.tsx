/**
 * Home Page Component
 * TRS Section 6: Main dashboard route with integrated components
 * 
 * Features:
 * - Integrated ProductionFlowMap, SummaryStats, and GapDriversTable
 * - Real-time data updates via React Query
 * - Enhanced layout with Phase 5A components
 * - Filter state management via URL parameters
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryStats } from '../components/SummaryStats/SummaryStats';
import { CargoScheduleTable } from '../components/CargoSchedule/CargoScheduleTable';
import { GapDriversTable } from '../components/GapDrivers/GapDriversTable';
import { TerminalsCompact } from '../components/Terminal/TerminalsCompact';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleAssetClick = (assetId: 'east' | 'west') => {
    navigate(`/asset/${assetId}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <SummaryStats onAssetClick={handleAssetClick} />

      {/* Gap Drivers Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6">
          <GapDriversTable 
            enableFiltering={true}
            showDetailedImpact={true}
            maxRows={5}
          />
        </div>
      </div>

      {/* Terminals Overview (Compact) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terminals Overview</h2>
          <p className="text-gray-600 dark:text-gray-400">Key KPIs across Bonny, Forcados, and Sea Eagle</p>
        </div>
        <div className="p-6">
          <TerminalsCompact />
        </div>
      </div>

      {/* Cargo Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Cargo Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Consolidated view of cargo schedules across all terminals
          </p>
        </div>
        <div className="p-6">
          <CargoScheduleTable />
        </div>
      </div>
    </div>
  );
}; 