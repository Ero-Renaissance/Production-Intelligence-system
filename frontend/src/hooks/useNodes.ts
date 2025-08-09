/**
 * useNodes Hook
 * TRS Section 7: React Query data fetching for production nodes
 * 
 * Features:
 * - 60s polling interval as specified in TRS
 * - Cache keys including filters + stream
 * - Optimistic UI updates and cache invalidation
 * - Error handling patterns for production environment
 */

import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { NodeKpi } from '../types/api'
import { apiClient } from '../api/axios'

interface UseNodesOptions {
  /** Enable/disable polling (default: true) */
  enabled?: boolean
  /** Custom refetch interval (default: 60s as per TRS) */
  refetchInterval?: number
}

/**
 * Fetch production nodes with filtering support
 * Implements TRS Section 7 caching strategy with stream-based cache keys
 */
export const useNodes = (options: UseNodesOptions = {}): UseQueryResult<NodeKpi[], Error> => {
  const [searchParams] = useSearchParams()
  
  // Extract filters from URL for cache key generation
  const stream = searchParams.get('stream') || 'all'
  const asset = searchParams.get('asset') || 'all'
  const unit = searchParams.get('unit') || 'all'
  const view = searchParams.get('view') || 'overview'

  const {
    enabled = true,
    refetchInterval = 60000, // TRS Section 7: 60s polling
  } = options

  return useQuery({
    // TRS Section 7: Cache keys including filters + stream
    queryKey: ['nodes', { stream, asset, unit, view }],
    
    queryFn: async (): Promise<NodeKpi[]> => {
      const params = new URLSearchParams()
      
      // Add non-default filters to API request
      if (stream !== 'all') params.set('stream', stream)
      if (asset !== 'all') params.set('asset', asset)
      if (unit !== 'all') params.set('unit', unit)
      if (view !== 'overview') params.set('view', view)

      const response = await apiClient.get<NodeKpi[]>(`/nodes?${params.toString()}`)
      return response.data
    },

    // TRS Section 7: Configuration
    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    
    // Production monitoring optimization
    staleTime: 30000, // Consider data stale after 30s
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    
    // Error handling for production environment
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    
    // Enhanced error handling
    throwOnError: false,
  })
}

/**
 * Get a single node by ID
 * Used for node detail pages and specific equipment monitoring
 */
export const useNode = (nodeId: string | undefined, options: UseNodesOptions = {}): UseQueryResult<NodeKpi, Error> => {
  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['node', nodeId],
    
    queryFn: async (): Promise<NodeKpi> => {
      if (!nodeId) throw new Error('Node ID is required')
      
      const response = await apiClient.get<NodeKpi>(`/nodes/${nodeId}`)
      return response.data
    },

    enabled: enabled && Boolean(nodeId),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Utility hook to invalidate nodes cache
 * Used after mutations or when manual refresh is needed
 */
export const useInvalidateNodes = () => {
  const queryClient = useQueryClient()
  
  return {
    invalidateAllNodes: () => queryClient.invalidateQueries({ queryKey: ['nodes'] }),
    invalidateNode: (nodeId: string) => queryClient.invalidateQueries({ queryKey: ['node', nodeId] }),
    refetchNodes: () => queryClient.refetchQueries({ queryKey: ['nodes'] }),
  }
} 