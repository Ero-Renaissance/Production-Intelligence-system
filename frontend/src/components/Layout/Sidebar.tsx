/**
 * Sidebar Component
 * Following TRS Section 8 styling standards and Phase 3 implementation plan
 * 
 * Features:
 * - Hierarchical asset navigation
 * - Production unit drill-down
 * - Security-ready role-based navigation
 * - Responsive design with mobile support
 */

import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home,
  ChevronDown,
  ChevronRight,
  Factory,
  Settings,
  X,
  Target,
  Beaker
} from 'lucide-react';
import { useAssets } from '../../hooks/useAssets';
import { useUser } from '../../context/UserContext';

interface SidebarProps {
  onClose: () => void;
}

// No hardcoded assets; sidebar is driven by /api/assets

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [expandedAssets, setExpandedAssets] = useState<string[]>([]);
  const [expandedPUs, setExpandedPUs] = useState<string[]>([]);
  const { data: assetsData, isLoading, error } = useAssets({ enabled: true });
  const { role } = useUser();

  const assets = useMemo(() => {
    if (!assetsData) return [] as Array<{ id: 'east'|'west'; name: string; productionUnits: Array<{ id: string; name: string; facilities: Array<{ id: string; type: string }> }> }>;
    return assetsData.assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      productionUnits: (asset.productionUnits || []).map(unit => ({
        id: unit.id,
        name: unit.name || unit.id,
        facilities: (unit.facilities || []).map(f => ({ id: f.id, type: f.type }))
      }))
    }))
  }, [assetsData]);

  const toggleAsset = (assetId: string) => {
    setExpandedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const togglePU = (puId: string) => {
    setExpandedPUs(prev =>
      prev.includes(puId)
        ? prev.filter(id => id !== puId)
        : [...prev, puId]
    );
  };

  const perfEnabled = role === 'performance-lead';
  const progEnabled = role === 'production-programmer' || role === 'production-technologist';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg">
      {/* Sidebar header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src="/brand/logo.png"
            alt="Renaissance Africa Energy"
            className="h-7 w-auto object-contain"
          />
          <span className="sr-only">Production Intelligence</span>
        </div>
        
        <button
          onClick={onClose}
          className="lg:hidden -mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green"
          aria-label="Close sidebar"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) => `
            group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
            ${isActive 
              ? 'bg-brand-green text-white' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
          `}
        >
          <Home className="mr-3 h-5 w-5 flex-shrink-0" />
          Dashboard
        </NavLink>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-2 mt-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 px-2 py-1">
            Failed to load assets
          </div>
        )}

        {/* Assets and Production Units */}
        {assets.map(asset => (
          <div key={asset.id} className="space-y-1">
            {/* Asset Header Row */}
            <div className="w-full flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <NavLink to={`/asset/${asset.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                <Factory className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{asset.name}</span>
              </NavLink>
              <button
                onClick={() => toggleAsset(asset.id)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={expandedAssets.includes(asset.id) ? 'Collapse asset' : 'Expand asset'}
              >
                {expandedAssets.includes(asset.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Production Units */}
            {expandedAssets.includes(asset.id) && (
              <div className="ml-4 space-y-1">
                {asset.productionUnits.map(pu => (
                  <div key={pu.id} className="space-y-1">
                    {/* PU Header Row */}
                    <div className="w-full flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <NavLink to={`/asset/${asset.id}/hub/${pu.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                        <Factory className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{pu.name}</span>
                      </NavLink>
                      <button
                        onClick={() => togglePU(pu.id)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label={expandedPUs.includes(pu.id) ? 'Collapse hub' : 'Expand hub'}
                      >
                        {expandedPUs.includes(pu.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Facilities */}
                    {expandedPUs.includes(pu.id) && (
                      <div className="ml-4 space-y-1">
                        {pu.facilities.map(f => (
                          <NavLink
                            key={f.id}
                            to={`/facility/${f.id}`}
                            className={({ isActive }) => `
                              group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
                              ${isActive 
                                ? 'bg-brand-green/10 text-brand-green' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }
                            `}
                          >
                            <span className="flex items-center">
                              <Factory className="mr-3 h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{f.id}</span>
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Role-specific entries (POC placeholders) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-1">
          <NavLink
            to="/targets"
            className={({ isActive }) => `
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
              ${isActive ? 'bg-brand-green text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
              ${perfEnabled ? '' : 'opacity-50 pointer-events-none'}
            `}
            aria-disabled={!perfEnabled}
          >
            <Target className="mr-3 h-5 w-5" />
            Define Targets
          </NavLink>

          <NavLink
            to="/optimisation"
            className={({ isActive }) => `
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
              ${isActive ? 'bg-brand-green text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
              ${progEnabled ? '' : 'opacity-50 pointer-events-none'}
            `}
            aria-disabled={!progEnabled}
          >
            <Beaker className="mr-3 h-5 w-5" />
            Optimisation & Simulation
          </NavLink>
        </div>

        {/* Settings */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
              ${isActive 
                ? 'bg-brand-green text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </NavLink>
        </div>
      </nav>
    </div>
  );
}; 