/**
 * Color Mapping Utilities
 * Following TRS Section 3 specifications and Section 8 design tokens
 * 
 * Provides consistent color mapping for:
 * - Constraint levels (normal, warning, critical, offline)
 * - Stream types (oil, export-gas, domestic-gas) 
 * - Status indicators and trends
 * - Data visualization themes
 */

import type { ConstraintLevel, StreamType } from '../types/api';

// =============================================================================
// CONSTRAINT LEVEL COLORS (TRS Section 8)
// =============================================================================

/**
 * Color mapping for constraint levels using TRS design tokens
 */
export const CONSTRAINT_COLORS: Record<ConstraintLevel, string> = {
  normal: '#10b981',    // brand-green from TRS Section 8
  warning: '#f59e0b',   // brand-amber from TRS Section 8
  critical: '#ef4444',  // brand-red from TRS Section 8
  offline: '#6b7280',   // brand-gray from TRS Section 8
};

/**
 * Get Tailwind CSS class for constraint level
 */
export const getConstraintColorClass = (
  level: ConstraintLevel,
  type: 'bg' | 'text' | 'border' = 'bg'
): string => {
  const colorMap: Record<ConstraintLevel, Record<string, string>> = {
    normal: {
      bg: 'bg-brand-green',
      text: 'text-brand-green',
      border: 'border-brand-green',
    },
    warning: {
      bg: 'bg-brand-amber',
      text: 'text-brand-amber',
      border: 'border-brand-amber',
    },
    critical: {
      bg: 'bg-brand-red',
      text: 'text-brand-red',
      border: 'border-brand-red',
    },
    offline: {
      bg: 'bg-brand-gray',
      text: 'text-brand-gray',
      border: 'border-brand-gray',
    },
  };

  return (colorMap[level] && colorMap[level][type]) || colorMap.normal[type];
};

// =============================================================================
// STREAM TYPE COLORS (TRS Section 8)
// =============================================================================

/**
 * Color mapping for stream types using TRS design tokens
 */
export const STREAM_COLORS: Record<StreamType, string> = {
  'oil': '#075985',          // bg-oil-500 from TRS Section 8
  'export-gas': '#065f46',   // bg-exportgas-500 from TRS Section 8
  'domestic-gas': '#6b21a8', // bg-domgas-500 from TRS Section 8
};

/**
 * Get Tailwind CSS class for stream type
 */
export const getStreamColorClass = (
  stream: StreamType,
  type: 'bg' | 'text' | 'border' = 'bg'
): string => {
  const colorMap: Record<StreamType, Record<string, string>> = {
    'oil': {
      bg: 'bg-oil-500',
      text: 'text-oil-500',
      border: 'border-oil-500',
    },
    'export-gas': {
      bg: 'bg-exportgas-500',
      text: 'text-exportgas-500',
      border: 'border-exportgas-500',
    },
    'domestic-gas': {
      bg: 'bg-domgas-500',
      text: 'text-domgas-500',
      border: 'border-domgas-500',
    },
  };

  return (colorMap[stream] && colorMap[stream][type]) || colorMap.oil[type];
};

// =============================================================================
// TREND INDICATORS
// =============================================================================

/**
 * Color mapping for trend indicators
 */
export const TREND_COLORS = {
  up: {
    color: '#10b981', // green
    class: 'text-green-500',
    bgClass: 'bg-green-100',
    icon: '↗',
  },
  down: {
    color: '#ef4444', // red
    class: 'text-red-500',
    bgClass: 'bg-red-100',
    icon: '↘',
  },
  stable: {
    color: '#6b7280', // gray
    class: 'text-gray-500',
    bgClass: 'bg-gray-100',
    icon: '→',
  },
} as const;

export type TrendDirection = keyof typeof TREND_COLORS;

/**
 * Get trend color information
 */
export const getTrendColor = (trend: TrendDirection) => {
  return TREND_COLORS[trend] || TREND_COLORS.stable;
};

// =============================================================================
// STATUS INDICATORS
// =============================================================================

/**
 * Color mapping for various status types
 */
export const STATUS_COLORS = {
  // General status
  active: '#10b981',      // green
  inactive: '#6b7280',    // gray
  pending: '#f59e0b',     // amber
  error: '#ef4444',       // red
  
  // Optimization status
  acknowledged: '#3b82f6', // blue
  implementing: '#f59e0b', // amber
  completed: '#10b981',    // green
  rejected: '#ef4444',     // red
  
  // Priority levels
  low: '#6b7280',         // gray
  medium: '#f59e0b',      // amber
  high: '#fb7185',        // rose
  critical: '#ef4444',    // red
} as const;

export type StatusType = keyof typeof STATUS_COLORS;

/**
 * Get status color with Tailwind classes
 */
export const getStatusColor = (
  status: StatusType,
  type: 'bg' | 'text' | 'border' = 'bg'
): { color: string; class: string } => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.inactive;
  
  // Map colors to Tailwind classes
  const classMap: Record<string, Record<string, string>> = {
    '#10b981': { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
    '#6b7280': { bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' },
    '#f59e0b': { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
    '#ef4444': { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
    '#3b82f6': { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
    '#fb7185': { bg: 'bg-rose-400', text: 'text-rose-400', border: 'border-rose-400' },
  };

  const classes = classMap[color] || classMap['#6b7280'];
  
  return {
    color,
    class: classes[type],
  };
};

// =============================================================================
// CHART THEMES
// =============================================================================

/**
 * ApexCharts theme configuration following TRS design tokens
 */
export const CHART_THEME = {
  palette: [
    '#075985',  // oil
    '#065f46',  // export-gas
    '#6b21a8',  // domestic-gas
    '#10b981',  // brand-green
    '#f59e0b',  // brand-amber
    '#ef4444',  // brand-red
    '#6b7280',  // brand-gray
    '#3b82f6',  // blue
  ],
  background: {
    light: '#ffffff',
    dark: '#1e293b',
  },
  text: {
    light: '#1f2937',
    dark: '#f1f5f9',
  },
  grid: {
    light: '#f3f4f6',
    dark: '#334155',
  },
};

/**
 * Get chart theme configuration for light/dark mode
 */
export const getChartTheme = (isDark: boolean = false) => {
  return {
    palette: CHART_THEME.palette,
    background: isDark ? CHART_THEME.background.dark : CHART_THEME.background.light,
    foreColor: isDark ? CHART_THEME.text.dark : CHART_THEME.text.light,
    toolbar: {
      background: isDark ? CHART_THEME.background.dark : CHART_THEME.background.light,
    },
    grid: {
      borderColor: isDark ? CHART_THEME.grid.dark : CHART_THEME.grid.light,
    },
  };
};

// =============================================================================
// GRADIENT UTILITIES
// =============================================================================

/**
 * Generate gradient CSS for constraint levels
 */
export const getConstraintGradient = (level: ConstraintLevel): string => {
  const color = CONSTRAINT_COLORS[level];
  return `linear-gradient(135deg, ${color}20, ${color}05)`;
};

/**
 * Generate gradient CSS for stream types
 */
export const getStreamGradient = (stream: StreamType): string => {
  const color = STREAM_COLORS[stream];
  return `linear-gradient(135deg, ${color}20, ${color}05)`;
};

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

/**
 * Get high contrast color for accessibility
 */
export const getAccessibleColor = (
  backgroundColor: string,
  lightColor: string = '#ffffff',
  darkColor: string = '#000000'
): string => {
  // Simple luminance calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? darkColor : lightColor;
};

/**
 * Validate color contrast ratio for WCAG compliance
 */
export const validateColorContrast = (
  foreground: string,
  background: string,
  minRatio: number = 4.5
): boolean => {
  // This is a simplified implementation
  // In production, use a proper color contrast library
  const fgLum = getRelativeLuminance(foreground);
  const bgLum = getRelativeLuminance(background);
  
  const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  return contrast >= minRatio;
};

/**
 * Calculate relative luminance (simplified)
 */
const getRelativeLuminance = (color: string): number => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}; 