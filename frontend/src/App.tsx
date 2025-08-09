/**
 * Main Application Component
 * Following TRS Section 6 routing specifications and Phase 3 implementation plan
 * 
 * Features:
 * - React Router v6 configuration
 * - URL-based filter state management
 * - Security-ready routing structure
 * - Layout component integration
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { AssetDetail } from './pages/AssetDetail';
import { HubDetail } from './pages/HubDetail';
import { FacilityDetail } from './pages/FacilityDetail';
import { Targets } from './pages/Targets';
import { OptimisationSimulation } from './pages/OptimisationSimulation';
import { WellDetail } from './pages/WellDetail';
import { AppShell } from './components/Layout/AppShell';
import { UserProvider } from './context/UserContext';
import { SettingsPage } from './pages/Settings';
import { NotFoundPage } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <AppShell>
            <Suspense fallback={<div className="p-6">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/asset/:assetId" element={<AssetDetail />} />
                <Route path="/asset/:assetId/hub/:hubId" element={<HubDetail />} />
                <Route path="/facility/:facilityId" element={<FacilityDetail />} />
                <Route path="/well/:wellId" element={<WellDetail />} />
                <Route path="/targets" element={<Targets />} />
                <Route path="/optimisation" element={<OptimisationSimulation />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AppShell>
        </div>
      </UserProvider>
    </Router>
  );
};
