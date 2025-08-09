/**
 * GapDriversTable Component
 * TRS Section 5: Sortable table of top gap contributors
 * 
 * Features:
 * - Sortable columns for impact, priority, duration
 * - Status indicators with color coding
 * - Stream filtering integration
 * - Root cause analysis display
 * - Action tracking and response management
 */

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/axios'
import { GapDriverSchema } from '../../types/schemas'
import type { GapDriver as ApiGapDriver } from '../../types/api'
import { ChevronUp, ChevronDown, AlertTriangle, Clock, TrendingDown, Filter, Search } from 'lucide-react'

type GapDriver = ApiGapDriver

interface GapDriversTableProps {
  /** Enable stream filtering */
  enableFiltering?: boolean
  /** Show detailed impact analysis */
  showDetailedImpact?: boolean
  /** Maximum number of rows to display */
  maxRows?: number
  /** Optional: force filtering to a specific asset */
  assetId?: 'east' | 'west'
  /** Optional: filter to a specific facility/node id */
  facilityId?: string
  /** Optional: filter to a list of facilities/node ids */
  facilityIds?: string[]
}

type SortField = 'impact' | 'priority' | 'duration' | 'lastUpdated'
type SortDirection = 'asc' | 'desc'

const useGapDrivers = (assetId?: 'east' | 'west') => {
  return useQuery({
    queryKey: ['gap-drivers', assetId],
    queryFn: async (): Promise<GapDriver[]> => {
      const params = new URLSearchParams()
      if (assetId) params.set('asset', assetId)
      const suffix = params.toString() ? `?${params.toString()}` : ''
      const res = await apiClient.get<GapDriver[]>(`/gap-drivers${suffix}`)
      // Validate payload per item
      return (res.data || []).map((d) => GapDriverSchema.parse(d))
    },
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

/**
 * Get priority color and icon
 */
const getPriorityDisplay = (priority: GapDriver['priority']) => {
  switch (priority) {
    case 'critical':
      return { 
        color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20', 
        text: 'Critical',
        icon: AlertTriangle 
      }
    case 'high':
      return { 
        color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20', 
        text: 'High',
        icon: TrendingDown 
      }
    case 'medium':
      return { 
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20', 
        text: 'Medium',
        icon: Clock 
      }
    default:
      return { 
        color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20', 
        text: 'Low',
        icon: Clock 
      }
  }
}

/**
 * Get status color
 */
const getStatusColor = (status: GapDriver['status']) => {
  switch (status) {
    case 'active':
      return 'text-red-600 dark:text-red-400'
    case 'acknowledged':
      return 'text-amber-600 dark:text-amber-400'
    case 'resolved':
      return 'text-green-600 dark:text-green-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

/**
 * Format duration for display
 */
const formatDuration = (hours: number) => {
  if (hours < 24) {
    return `${hours}h`
  } else {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }
}

export const GapDriversTable: React.FC<GapDriversTableProps> = ({
  enableFiltering = true,
  showDetailedImpact = true,
  maxRows = 10,
  assetId,
  facilityId,
  facilityIds,
}) => {
  const [searchParams] = useSearchParams()
  const [sortField, setSortField] = useState<SortField>('impact')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  
  const stream = searchParams.get('stream') || 'all'
  const assetParam = (assetId || (searchParams.get('asset') as 'east' | 'west' | null)) || undefined
  const { data: apiDrivers, isLoading, error } = useGapDrivers(assetParam)

  // Filter and sort data
  const processedData = useMemo(() => {
    const source = apiDrivers || []
    let filtered = [...source]

    // Filter by facility when provided
    if (facilityId) {
      filtered = filtered.filter(d => d.nodeId === facilityId)
    }
    if (facilityIds && facilityIds.length > 0) {
      const set = new Set(facilityIds)
      filtered = filtered.filter(d => set.has(d.nodeId))
    }

    // Filter by stream
    if (stream !== 'all' && enableFiltering) {
      filtered = filtered.filter(driver => 
        driver.affectedStreams.some(s => 
          s.toLowerCase().includes(stream.toLowerCase())
        )
      )
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.nodeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.gapType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort data
    filtered.sort((a, b) => {
      let aValue: number, bValue: number

      switch (sortField) {
        case 'impact':
          aValue = a.impact.lostProduction
          bValue = b.impact.lostProduction
          break
        case 'priority': {
          const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        }
        case 'duration':
          aValue = a.duration.totalHours
          bValue = b.duration.totalHours
          break
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated).getTime()
          bValue = new Date(b.lastUpdated).getTime()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered.slice(0, maxRows)
  }, [apiDrivers, stream, searchTerm, sortField, sortDirection, maxRows, enableFiltering, facilityId, facilityIds])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Production Gap Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading...' : error ? 'Error loading gap drivers' : `${processedData.length} gap drivers affecting production`}
          </p>
        </div>

        {enableFiltering && (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search gaps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {stream !== 'all' && (
              <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                <Filter className="h-4 w-4" />
                <span>Filtered by {stream}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl shadow-md overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Node & Description
                </th>
                
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('impact')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Impact</span>
                    {getSortIcon('impact')}
                  </div>
                </th>

                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Priority</span>
                    {getSortIcon('priority')}
                  </div>
                </th>

                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Duration</span>
                    {getSortIcon('duration')}
                  </div>
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {processedData.map((driver) => {
                const priorityDisplay = getPriorityDisplay(driver.priority)
                const PriorityIcon = priorityDisplay.icon

                return (
                  <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Node & Description */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {driver.nodeName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {driver.description}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                            {driver.gapType}
                          </span>
                          {driver.affectedStreams.map(stream => (
                            <span key={stream} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {stream}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Impact */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {driver.impact.lostProduction.toLocaleString()} {driver.impact.unit}
                        </div>
                        {showDetailedImpact && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {driver.impact.percentage.toFixed(1)}% loss
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${priorityDisplay.color}`}>
                        <PriorityIcon className="h-4 w-4" />
                        <span>{priorityDisplay.text}</span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDuration(driver.duration.totalHours)}
                      </div>
                      {driver.duration.estimated_end && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Est. end: {new Date(driver.duration.estimated_end).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium capitalize ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                    </td>
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>

        {(!apiDrivers || apiDrivers.length === 0) && !isLoading && !error && (
          <div className="p-8 text-center">
            <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Gap Drivers Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No gaps match your search criteria.' : 'No production gaps detected for the selected filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 