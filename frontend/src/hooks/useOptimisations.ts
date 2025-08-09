/**
 * useOptimisations Hook
 * TRS Section 7: React Query data fetching for optimization recommendations
 * 
 * Features:
 * - Stream-filtered optimization actions (Oil, Export Gas, Domestic Gas)
 * - PATCH mutations for Acknowledge/Implement actions
 * - Optimistic UI updates and cache invalidation
 * - Role-based filtering for Production Programmers
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { OptimisationAction } from '../types/api'
import { apiClient } from '../api/axios'

interface UseOptimisationsOptions {
  /** Enable/disable polling (default: true) */
  enabled?: boolean
  /** Custom refetch interval (default: 60s as per TRS) */
  refetchInterval?: number
}

interface OptimisationActionUpdate {
  id: string
  action: 'acknowledge' | 'implement' | 'dismiss'
  userId?: string
  comment?: string
}

interface OptimisationResponse {
  optimisations: OptimisationAction[]
  summary: {
    total: number
    pending: number
    acknowledged: number
    implemented: number
    totalPotentialValue: number // ROI in currency
  }
}

/**
 * Fetch optimization recommendations with stream filtering
 * Supports Production Programmers' optimization workflow
 */
export const useOptimisations = (options: UseOptimisationsOptions = {}): UseQueryResult<OptimisationResponse, Error> => {
  const [searchParams] = useSearchParams()
  
  // Extract filters from URL for stream-specific optimizations
  const stream = searchParams.get('stream') || 'all'
  const asset = searchParams.get('asset') || 'all'
  const status = searchParams.get('status') || 'all'
  const priority = searchParams.get('priority') || 'all'

  const {
    enabled = true,
    refetchInterval = 60000, // TRS Section 7: 60s polling
  } = options

  return useQuery({
    // TRS Section 7: Cache keys including filters + stream
    queryKey: ['optimisations', { stream, asset, status, priority }],
    
    queryFn: async (): Promise<OptimisationResponse> => {
      const params = new URLSearchParams()
      
      // Add filters to API request
      if (stream !== 'all') params.set('stream', stream)
      if (asset !== 'all') params.set('asset', asset)
      if (status !== 'all') params.set('status', status)
      if (priority !== 'all') params.set('priority', priority)

      const response = await apiClient.get<OptimisationResponse>(`/optimisations?${params.toString()}`)
      return response.data
    },

    // TRS Section 7: Configuration
    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    
    // Optimization data can be slightly less fresh than real-time metrics
    staleTime: 45000, // 45s stale time
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    
    // Standard retry logic for optimization data
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get optimization recommendations for a specific asset
 * Used for asset-specific optimization dashboards
 */
export const useAssetOptimisations = (
  assetId: 'east' | 'west' | undefined,
  options: UseOptimisationsOptions = {}
): UseQueryResult<OptimisationResponse, Error> => {
  const [searchParams] = useSearchParams()
  const stream = searchParams.get('stream') || 'all'

  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['optimisations', 'asset', assetId, { stream }],
    
    queryFn: async (): Promise<OptimisationResponse> => {
      if (!assetId) throw new Error('Asset ID is required')
      
      const params = new URLSearchParams()
      params.set('asset', assetId)
      if (stream !== 'all') params.set('stream', stream)

      const response = await apiClient.get<OptimisationResponse>(`/optimisations?${params.toString()}`)
      return response.data
    },

    enabled: enabled && Boolean(assetId),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 45000,
    gcTime: 15 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Mutation hook for acknowledging optimization recommendations
 * TRS Section 7: PATCH calls for mutations with optimistic updates
 */
export const useAcknowledgeOptimisation = (): UseMutationResult<OptimisationAction, Error, OptimisationActionUpdate> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: OptimisationActionUpdate): Promise<OptimisationAction> => {
      const response = await apiClient.patch<OptimisationAction>(
        `/optimisations/${update.id}/acknowledge`,
        {
          userId: update.userId,
          comment: update.comment,
          acknowledgedAt: new Date().toISOString(),
        }
      )
      return response.data
    },

    // TRS Section 7: Optimistic UI updates and cache invalidation
    onMutate: async (update) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['optimisations'] })

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['optimisations'] })

      // Optimistically update the cache
      queryClient.setQueriesData<OptimisationResponse>({ queryKey: ['optimisations'] }, (old) => {
        if (!old) return old

        return {
          ...old,
          optimisations: old.optimisations.map(opt =>
            opt.id === update.id
              ? { ...opt, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
              : opt
          ),
          summary: {
            ...old.summary,
            pending: old.summary.pending - 1,
            acknowledged: old.summary.acknowledged + 1,
          }
        }
      })

      return { previousData }
    },

    onError: (_err, _update, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },

    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['optimisations'] })
    },
  })
}

/**
 * Mutation hook for implementing optimization recommendations
 * Triggers actual production changes - requires confirmation
 */
export const useImplementOptimisation = (): UseMutationResult<OptimisationAction, Error, OptimisationActionUpdate> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: OptimisationActionUpdate): Promise<OptimisationAction> => {
      const response = await apiClient.patch<OptimisationAction>(
        `/optimisations/${update.id}/implement`,
        {
          userId: update.userId,
          comment: update.comment,
          implementedAt: new Date().toISOString(),
        }
      )
      return response.data
    },

    // Optimistic updates for implementation
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: ['optimisations'] })

      const previousData = queryClient.getQueriesData({ queryKey: ['optimisations'] })

      queryClient.setQueriesData<OptimisationResponse>({ queryKey: ['optimisations'] }, (old) => {
        if (!old) return old

        return {
          ...old,
          optimisations: old.optimisations.map(opt =>
            opt.id === update.id
              ? { ...opt, status: 'completed' as const }
              : opt
          ),
          summary: {
            ...old.summary,
            pending: old.summary.pending - 1,
            implemented: old.summary.implemented + 1,
          }
        }
      })

      return { previousData }
    },

    onError: (_err, _update, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },

    onSettled: () => {
      // Refetch all related data after implementation
      queryClient.invalidateQueries({ queryKey: ['optimisations'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['nodes'] })
    },
  })
}

/**
 * Get optimization recommendations by priority level
 * Used for urgent action identification
 */
export const useHighPriorityOptimisations = (options: UseOptimisationsOptions = {}): UseQueryResult<OptimisationAction[], Error> => {
  const { enabled = true, refetchInterval = 30000 } = options // More frequent for high priority

  return useQuery({
    queryKey: ['optimisations', 'high-priority'],
    
    queryFn: async (): Promise<OptimisationAction[]> => {
      const response = await apiClient.get<OptimisationResponse>('/optimisations?priority=high&status=pending')
      return response.data.optimisations
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 15000, // High priority items need fresh data
    gcTime: 5 * 60 * 1000,
    throwOnError: false,
  })
} 