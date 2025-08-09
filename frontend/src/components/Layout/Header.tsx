/**
 * Header Component
 * Following TRS Section 8 styling standards and Phase 3 implementation plan
 * 
 * Features:
 * - Application branding and title
 * - System health indicators
 * - Mobile menu toggle
 * - Real-time status updates
 * - Security-ready user menu placeholder
 */

import React from 'react';
import { Menu, Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * Main application header
 * Displays system status and provides navigation controls
 */
export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { username, role, setRole, setUsername } = useUser();

  const roles: Array<{ id: Parameters<typeof setRole>[0]; label: string }> = [
    { id: 'pmc-engineer', label: 'PMC Engineer' },
    { id: 'performance-lead', label: 'Performance Lead' },
    { id: 'production-programmer', label: 'Production Programmer' },
    { id: 'production-technologist', label: 'Production Technologist' },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left section - Mobile menu + Logo */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Application logo (mobile) */}
            <div className="flex items-center lg:hidden ml-4">
              <img
                src="/brand/logo.png"
                alt="Renaissance Africa Energy"
                className="h-6 w-auto object-contain"
              />
              <span className="sr-only">Production Intelligence</span>
            </div>
          </div>

          {/* Center section - System status indicators */}
          <div className="hidden md:flex items-center space-x-6">
            {/* System health indicator */}
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-brand-green" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                11/13 Nodes Online
              </span>
            </div>

            {/* Active alerts indicator */}
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-brand-amber" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                4 Active Issues
              </span>
            </div>
          </div>

          {/* Right section - Notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="bg-white dark:bg-gray-800 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green relative"
              aria-label="View notifications"
            >
              <Bell className="h-6 w-6" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-red text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Role switcher - segmented control (POC) */}
            <div className="hidden lg:flex items-center">
              <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-0.5">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`px-3 py-1.5 text-xs rounded-full transition
                      ${role === r.id 
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}
                    `}
                    aria-pressed={role === r.id}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User menu */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                  {username && username.trim() !== '' ? username.substring(0, 2).toUpperCase() : 'OP'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = window.prompt('Set display name', username);
                  if (next && next.trim()) {
                    setUsername(next.trim());
                  }
                }}
                className="text-sm text-gray-700 dark:text-gray-300 hover:underline"
                aria-label="Change display name"
              >
                {username && username.trim() !== '' ? username : 'Operator'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 