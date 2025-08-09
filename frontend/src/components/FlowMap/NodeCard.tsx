/**
 * NodeCard Component
 * TRS Section 5: Mini KPI card with colored border by constraintLevel
 * 
 * Features:
 * - Color-coded border based on constraint level (green/amber/red/grey)
 * - Mini KPI display with throughput and efficiency
 * - Click for drill-down navigation
 * - Real-time constraint indicators
 * - Accessibility support
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, CheckCircle, XCircle, Minus } from 'lucide-react'
import { NodeKpi, ConstraintLevel } from '../../types/api'

interface NodeCardProps {
  /** Production node data */
  node: NodeKpi
  /** Enable click navigation */
  enableDrillDown?: boolean
  /** Show constraint indicators */
  showConstraints?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Get color classes based on constraint level
 */
const getConstraintColors = (level: ConstraintLevel) => {
  switch (level) {
    case 'normal':
      return {
        border: 'border-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        icon: CheckCircle,
      }
    case 'warning':
      return {
        border: 'border-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        icon: AlertTriangle,
      }
    case 'critical':
      return {
        border: 'border-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        icon: XCircle,
      }
    case 'offline':
      return {
        border: 'border-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        icon: Minus,
      }
    default:
      return {
        border: 'border-gray-300',
        bg: 'bg-white dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        icon: Activity,
      }
  }
}

/**
 * Format throughput for display
 */
const formatThroughput = (throughput: NodeKpi['throughput']) => {
  const rate = throughput.current
  const unit = throughput.unit || 'bbl/d'
  
  if (rate >= 1000000) {
    return `${(rate / 1000000).toFixed(1)}M ${unit}`
  } else if (rate >= 1000) {
    return `${(rate / 1000).toFixed(1)}k ${unit}`
  } else {
    return `${rate.toFixed(0)} ${unit}`
  }
}

/**
 * Get utilization status color
 */
const getUtilizationColor = (efficiency: number) => {
  if (efficiency >= 90) return 'text-green-600 dark:text-green-400'
  if (efficiency >= 75) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  enableDrillDown = true,
  showConstraints = true,
  className = '',
}) => {
  const navigate = useNavigate()
  
  const colors = getConstraintColors(node.constraintLevel)
  const ConstraintIcon = colors.icon
  
  const handleClick = () => {
    if (enableDrillDown) {
      navigate(`/node/${node.id}`)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (enableDrillDown && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      navigate(`/node/${node.id}`)
    }
  }

  return (
    <div
      className={`
        rounded-2xl shadow-md p-4 bg-white dark:bg-slate-800 border-2 
        ${colors.border} 
        ${enableDrillDown ? 'cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200' : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={enableDrillDown ? 0 : -1}
      role={enableDrillDown ? 'button' : 'article'}
      aria-label={`${node.name} - ${node.type} - ${node.constraintLevel} status`}
    >
      {/* Header with constraint indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {node.name}
          </h3>
          {showConstraints && (
            <ConstraintIcon 
              className={`h-4 w-4 ${colors.text}`}
              aria-label={`${node.constraintLevel} status`}
            />
          )}
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {node.type.replace('-', ' ')}
        </span>
      </div>

      {/* Throughput Information */}
      <div className="space-y-2">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatThroughput(node.throughput)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            of {formatThroughput({ ...node.throughput, current: node.throughput.capacity })} capacity
          </div>
        </div>

        {/* Efficiency Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Efficiency
          </span>
          <span className={`text-sm font-medium ${getUtilizationColor(node.throughput.efficiency)}`}>
            {node.throughput.efficiency.toFixed(1)}%
          </span>
        </div>

        {/* Efficiency Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              node.throughput.efficiency >= 90 ? 'bg-green-500' :
              node.throughput.efficiency >= 75 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(node.throughput.efficiency, 100)}%` }}
            aria-label={`${node.throughput.efficiency}% efficiency`}
          />
        </div>
      </div>

      {/* Stream Information */}
      {(node.streams.oil || node.streams.exportGas || node.streams.domesticGas) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 gap-1 text-xs">
            {node.streams.oil && (
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Oil:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {node.streams.oil.rate.toLocaleString()} {node.streams.oil.unit}
                </span>
              </div>
            )}
            {node.streams.exportGas && (
              <div className="flex justify-between">
                <span className="text-green-600 dark:text-green-400">Export Gas:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {node.streams.exportGas.rate.toLocaleString()} {node.streams.exportGas.unit}
                </span>
              </div>
            )}
            {node.streams.domesticGas && (
              <div className="flex justify-between">
                <span className="text-purple-600 dark:text-purple-400">Domestic Gas:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {node.streams.domesticGas.rate.toLocaleString()} {node.streams.domesticGas.unit}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen reader information */}
      <span className="sr-only">
        {node.name} {node.type} with {node.constraintLevel} status. 
        Current throughput: {formatThroughput(node.throughput)}. 
        Efficiency: {node.throughput.efficiency}%.
        {enableDrillDown ? ' Click or press Enter to view details.' : ''}
      </span>
    </div>
  )
} 