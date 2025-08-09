/**
 * useTerminalOperations Hook
 * User Requirement: Terminal operations with endurance tracking and cargo planning
 * 
 * Features:
 * - Terminal inventory and endurance days calculation
 * - Cargo export readiness and scheduling
 * - Loading operations monitoring
 * - Support for Production Programmers' cargo planning workflows
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../api/axios'
import type { TerminalId, TerminalOperations } from '../types/api';
import { TerminalOperationsSchema, type TerminalOperationsParsed } from '../types/schemas';

interface TerminalInventory {
  id: string
  terminalName: string
  currentInventory: number // barrels
  capacity: number // barrels
  utilizationPercent: number
  
  // Endurance calculations
  endurance: {
    days: number
    hoursRemaining: number
    estimatedDepletion: string // ISO date
    safetyThreshold: number // days
    status: 'safe' | 'warning' | 'critical'
  }
  
  // Quality specifications
  quality: {
    apiGravity: number
    sulfurContent: number
    waterContent: number
    temperature: number
    lastQualityCheck: string
  }
  
  lastUpdated: string
}

interface CargoSchedule {
  id: string
  vesselName: string
  vesselType: 'tanker' | 'lng_carrier' | 'bulk_carrier'
  cargoType: 'crude_oil' | 'refined_products' | 'lng' | 'gas'
  
  // Scheduling
  estimatedArrival: string
  plannedDeparture: string
  loadingDuration: number // hours
  
  // Cargo details
  requestedVolume: number // barrels
  maxCapacity: number // barrels
  loadingRate: number // barrels/hour
  
  // Readiness status
  readiness: {
    inventoryReady: boolean
    qualityApproved: boolean
    documentsComplete: boolean
    vesselApproved: boolean
    weatherClear: boolean
    overallStatus: 'ready' | 'pending' | 'delayed' | 'cancelled'
    estimatedReadiness: string // ISO date
  }
  
  // Financial
  contractValue?: number
  currency?: string
  
  status: 'scheduled' | 'loading' | 'completed' | 'cancelled'
  lastUpdated: string
}

interface LoadingOperation {
  id: string
  cargoId: string
  vesselName: string
  terminalId: string
  
  // Current operation status
  status: 'preparing' | 'loading' | 'paused' | 'completed' | 'aborted'
  startTime: string
  estimatedCompletion?: string
  actualCompletion?: string
  
  // Progress tracking
  progress: {
    volumeLoaded: number // barrels
    targetVolume: number // barrels
    percentComplete: number
    currentRate: number // barrels/hour
    averageRate: number // barrels/hour
    estimatedTimeRemaining: number // hours
  }
  
  // Operational details
  loadingArms: {
    total: number
    active: number
    statusList: Array<{
      armId: string
      status: 'active' | 'standby' | 'maintenance' | 'fault'
      currentRate: number
    }>
  }
  
  // Safety and environmental
  safety: {
    gasDetection: 'normal' | 'warning' | 'alarm'
    fireSystem: 'ready' | 'activated' | 'fault'
    spillContainment: 'secure' | 'breach'
    weatherConditions: 'suitable' | 'marginal' | 'unsuitable'
  }
  
  lastUpdated: string
}

// Removed TerminalOperationsResponse; not used in current UI

interface UseTerminalOperationsOptions {
  enabled?: boolean
  refetchInterval?: number
}

/**
 * Fetch complete terminal operations data
 * Primary hook for terminal management dashboard
 */
export const useTerminalOperations = (terminalId: TerminalId) => {
  return useQuery({
    queryKey: ['terminalOperations', terminalId],
    queryFn: async (): Promise<TerminalOperationsParsed> => {
      // Remove /api prefix since it's already in the base URL
      const response = await apiClient.get<TerminalOperations>(`/terminal/${terminalId}/operations`);
      return TerminalOperationsSchema.parse(response.data);
    },
    staleTime: 30000, // Consider data stale after 30s
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Get terminal inventory and endurance data
 * Focused on cargo readiness and planning
 */
export const useTerminalInventory = (options: UseTerminalOperationsOptions = {}): UseQueryResult<TerminalInventory[], Error> => {
  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['terminal', 'inventory'],
    
    queryFn: async (): Promise<TerminalInventory[]> => {
      const response = await apiClient.get<TerminalInventory[]>('/api/terminal/inventory')
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 45000,
    gcTime: 10 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get cargo schedule and readiness status
 * Used for export planning and scheduling
 */
export const useCargoSchedule = (options: UseTerminalOperationsOptions = {}): UseQueryResult<CargoSchedule[], Error> => {
  const [searchParams] = useSearchParams()
  const timeframe = searchParams.get('timeframe') || '30d'

  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['cargo', 'schedule', { timeframe }],
    
    queryFn: async (): Promise<CargoSchedule[]> => {
      const params = new URLSearchParams()
      if (timeframe !== '30d') params.set('timeframe', timeframe)

      const response = await apiClient.get<CargoSchedule[]>(`/api/cargo/schedule?${params.toString()}`)
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 60000, // Schedule data can be less frequent
    gcTime: 20 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get active loading operations
 * Real-time monitoring of cargo loading progress
 */
export const useLoadingOperations = (options: UseTerminalOperationsOptions = {}): UseQueryResult<LoadingOperation[], Error> => {
  const { enabled = true, refetchInterval = 30000 } = options // More frequent for active operations

  return useQuery({
    queryKey: ['loading', 'operations'],
    
    queryFn: async (): Promise<LoadingOperation[]> => {
      const response = await apiClient.get<LoadingOperation[]>('/api/loading/operations')
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 15000, // Active operations need fresh data
    gcTime: 5 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get cargo readiness forecast
 * Predicts when next cargo will be ready for export
 */
export const useCargoReadinessForecast = (options: UseTerminalOperationsOptions = {}): UseQueryResult<{
  nextCargoReady: string
  confidenceLevel: number
  forecast: Array<{
    date: string
    inventoryLevel: number
    cargoReadiness: boolean
    qualityStatus: 'approved' | 'pending' | 'failed'
  }>
}, Error> => {
  const { enabled = true, refetchInterval = 300000 } = options // 5 minutes for forecast data

  return useQuery({
    queryKey: ['cargo', 'readiness-forecast'],
    
    queryFn: async () => {
      const response = await apiClient.get('/api/cargo/readiness-forecast')
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 240000, // 4 minutes stale time for forecast
    gcTime: 30 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Update cargo schedule
 * Mutation for scheduling and rescheduling cargo operations
 */
export const useUpdateCargoSchedule = (): UseMutationResult<CargoSchedule, Error, {
  cargoId: string
  updates: Partial<Pick<CargoSchedule, 'estimatedArrival' | 'plannedDeparture' | 'requestedVolume' | 'status'>>
}> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cargoId, updates }) => {
      const response = await apiClient.patch<CargoSchedule>(`/api/cargo/${cargoId}/schedule`, updates)
      return response.data
    },

    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['cargo'] })
      queryClient.invalidateQueries({ queryKey: ['terminal-operations'] })
    },
  })
}

/**
 * Start loading operation
 * Mutation for initiating cargo loading
 */
export const useStartLoadingOperation = (): UseMutationResult<LoadingOperation, Error, {
  cargoId: string
  terminalId: string
  loadingConfig: {
    targetVolume: number
    maxRate: number
    activeArms: string[]
  }
}> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cargoId, terminalId, loadingConfig }) => {
      const response = await apiClient.post<LoadingOperation>('/api/loading/start', {
        cargoId,
        terminalId,
        ...loadingConfig,
      })
      return response.data
    },

    onSuccess: () => {
      // Refresh loading operations and terminal data
      queryClient.invalidateQueries({ queryKey: ['loading'] })
      queryClient.invalidateQueries({ queryKey: ['terminal'] })
      queryClient.invalidateQueries({ queryKey: ['cargo'] })
    },
  })
} 