/**
 * useAlerts Hook
 * User Requirement: Role-based alert filtering and management
 * 
 * Features:
 * - Role-specific alert filtering (monitoring, performance, programming)
 * - Real-time alert management for Production Monitoring Engineers
 * - Field communication and response tracking
 * - Priority-based alert handling
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../api/axios'

interface Alert {
  id: string
  type: 'production' | 'equipment' | 'safety' | 'quality' | 'scheduling' | 'system'
  priority: 'low' | 'medium' | 'high' | 'critical'
  severity: 'info' | 'warning' | 'error' | 'critical'
  
  // Alert content
  title: string
  description: string
  source: string // equipment/node that triggered the alert
  
  // Categorization
  category: 'operational' | 'maintenance' | 'safety' | 'performance' | 'environmental'
  stream?: 'oil' | 'export_gas' | 'domestic_gas'
  asset?: 'east' | 'west'
  affectedNodes: string[]
  
  // Status and lifecycle
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed'
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  
  // Response tracking
  response: {
    fieldNotified: boolean
    fieldResponse?: string
    actionsTaken: string[]
    estimatedResolution?: string
    actualResolution?: string
  }
  
  // Impact assessment
  impact: {
    productionLoss?: number // bbl/day
    safetyRisk: 'none' | 'low' | 'medium' | 'high' | 'critical'
    environmentalRisk: 'none' | 'low' | 'medium' | 'high'
    operationalImpact: 'none' | 'minor' | 'moderate' | 'major' | 'severe'
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
  escalationTime?: string
  
  // Auto-escalation rules
  escalation: {
    enabled: boolean
    escalateAfterMinutes: number
    escalationLevel: number
    maxEscalationLevel: number
    nextEscalationAt?: string
  }
}

interface AlertSummary {
  total: number
  active: number
  critical: number
  acknowledged: number
  resolved: number
  
  // By role focus
  monitoring: number // Real-time operational alerts
  performance: number // Efficiency and trend alerts
  programming: number // Optimization and planning alerts
  
  // By timeframe
  last24Hours: number
  lastWeek: number
  
  // Response metrics
  averageResponseTime: number // minutes
  averageResolutionTime: number // hours
}

interface AlertsResponse {
  alerts: Alert[]
  summary: AlertSummary
}

interface UseAlertsOptions {
  enabled?: boolean
  refetchInterval?: number
  role?: 'monitoring' | 'performance' | 'programming' | 'all'
}

/**
 * Fetch alerts with role-based filtering
 * Primary hook for alert management dashboards
 */
export const useAlerts = (options: UseAlertsOptions = {}): UseQueryResult<AlertsResponse, Error> => {
  const [searchParams] = useSearchParams()
  
  // Extract filters from URL
  const role = options.role || searchParams.get('role') || 'all'
  const priority = searchParams.get('priority') || 'all'
  const status = searchParams.get('status') || 'active'
  const asset = searchParams.get('asset') || 'all'
  const stream = searchParams.get('stream') || 'all'

  const {
    enabled = true,
    refetchInterval = 30000, // More frequent for alerts
  } = options

  return useQuery({
    queryKey: ['alerts', { role, priority, status, asset, stream }],
    
    queryFn: async (): Promise<AlertsResponse> => {
      const params = new URLSearchParams()
      
      if (role !== 'all') params.set('role', role)
      if (priority !== 'all') params.set('priority', priority)
      if (status !== 'active') params.set('status', status)
      if (asset !== 'all') params.set('asset', asset)
      if (stream !== 'all') params.set('stream', stream)

      const response = await apiClient.get<AlertsResponse>(`/api/alerts?${params.toString()}`)
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 15000, // Alerts need fresh data
    gcTime: 5 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get critical alerts requiring immediate attention
 * Used for urgent alert notifications
 */
export const useCriticalAlerts = (options: UseAlertsOptions = {}): UseQueryResult<Alert[], Error> => {
  const { enabled = true, refetchInterval = 15000 } = options // Very frequent for critical alerts

  return useQuery({
    queryKey: ['alerts', 'critical'],
    
    queryFn: async (): Promise<Alert[]> => {
      const response = await apiClient.get<Alert[]>('/api/alerts?priority=critical&status=active')
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 10000, // Critical alerts need very fresh data
    gcTime: 2 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get alerts for specific asset
 * Used for asset-focused monitoring dashboards
 */
export const useAssetAlerts = (
  assetId: 'east' | 'west' | undefined,
  options: UseAlertsOptions = {}
): UseQueryResult<Alert[], Error> => {
  const { enabled = true, refetchInterval = 30000 } = options

  return useQuery({
    queryKey: ['alerts', 'asset', assetId],
    
    queryFn: async (): Promise<Alert[]> => {
      if (!assetId) throw new Error('Asset ID is required')
      
      const response = await apiClient.get<Alert[]>(`/api/alerts?asset=${assetId}&status=active`)
      return response.data
    },

    enabled: enabled && Boolean(assetId),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 20000,
    gcTime: 10 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get alerts requiring field response
 * Filtered for Production Monitoring Engineers
 */
export const useFieldResponseAlerts = (options: UseAlertsOptions = {}): UseQueryResult<Alert[], Error> => {
  const { enabled = true, refetchInterval = 20000 } = options

  return useQuery({
    queryKey: ['alerts', 'field-response'],
    
    queryFn: async (): Promise<Alert[]> => {
      const response = await apiClient.get<Alert[]>('/api/alerts?requires_field_response=true&status=active,acknowledged')
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 15000,
    gcTime: 5 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Acknowledge alert
 * Mutation for Production Monitoring Engineers to acknowledge alerts
 */
export const useAcknowledgeAlert = (): UseMutationResult<Alert, Error, {
  alertId: string
  userId: string
  comment?: string
  fieldNotified?: boolean
}> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ alertId, userId, comment, fieldNotified }) => {
      const response = await apiClient.patch<Alert>(`/api/alerts/${alertId}/acknowledge`, {
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString(),
        comment,
        fieldNotified: fieldNotified || false,
      })
      return response.data
    },

    // Optimistic update
    onMutate: async ({ alertId }) => {
      await queryClient.cancelQueries({ queryKey: ['alerts'] })

      const previousData = queryClient.getQueriesData({ queryKey: ['alerts'] })

      // Update all alert queries
      queryClient.setQueriesData<AlertsResponse>({ queryKey: ['alerts'] }, (old) => {
        if (!old) return old

        return {
          ...old,
          alerts: old.alerts.map(alert =>
            alert.id === alertId
              ? { ...alert, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() }
              : alert
          ),
          summary: {
            ...old.summary,
            active: old.summary.active - 1,
            acknowledged: old.summary.acknowledged + 1,
          }
        }
      })

      return { previousData }
    },

    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

/**
 * Resolve alert
 * Mutation for marking alerts as resolved with resolution details
 */
export const useResolveAlert = (): UseMutationResult<Alert, Error, {
  alertId: string
  userId: string
  resolution: string
  actionsTaken: string[]
  fieldResponse?: string
}> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ alertId, userId, resolution, actionsTaken, fieldResponse }) => {
      const response = await apiClient.patch<Alert>(`/api/alerts/${alertId}/resolve`, {
        resolvedBy: userId,
        resolvedAt: new Date().toISOString(),
        resolution,
        actionsTaken,
        fieldResponse,
      })
      return response.data
    },

    onSuccess: (data) => {
      // Update cache optimistically
      queryClient.setQueriesData<AlertsResponse>({ queryKey: ['alerts'] }, (old) => {
        if (!old) return old

        return {
          ...old,
          alerts: old.alerts.map(alert =>
            alert.id === data.id ? data : alert
          ),
          summary: {
            ...old.summary,
            active: old.summary.active - 1,
            resolved: old.summary.resolved + 1,
          }
        }
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      // Also refresh summary and nodes in case alert resolution affects other data
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}

/**
 * Add field response to alert
 * Mutation for logging field team responses
 */
export const useAddFieldResponse = (): UseMutationResult<Alert, Error, {
  alertId: string
  response: string
  actionsTaken: string[]
  estimatedResolution?: string
}> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ alertId, response, actionsTaken, estimatedResolution }) => {
      const responseData = await apiClient.patch<Alert>(`/api/alerts/${alertId}/field-response`, {
        fieldResponse: response,
        actionsTaken,
        estimatedResolution,
        updatedAt: new Date().toISOString(),
      })
      return responseData.data
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
} 