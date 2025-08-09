/**
 * useAssets Hook
 * User Requirement: Hierarchical asset management for East/West assets
 * 
 * Features:
 * - East and West asset data with production units
 * - Asset-level KPIs and comparisons
 * - Production unit breakdown within each asset
 * - Support for Performance Management Engineers' workflows
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../api/axios'
import { AssetsResponseSchema, type AssetsResponseParsed } from '../types/schemas'

interface ProductionUnit {
  id: string
  name: string
  type: 'flowstation' | 'compressor' | 'gasplant' | 'terminal'
  status: 'online' | 'offline' | 'maintenance' | 'startup'
  currentProduction: number
  capacity: number
  efficiency: number
  equipmentCount: number
  activeEquipment: number
  lastUpdated: string
}

interface AssetData {
  id: 'east' | 'west'
  name: string
  status: 'normal' | 'warning' | 'critical'
  
  // Overall asset performance
  performance: {
    currentProduction: number
    capacity: number
    efficiency: number
    trend: 'increasing' | 'stable' | 'decreasing'
    changePercent: number
  }
  
  // Production units within this asset
  productionUnits: ProductionUnit[]
  
  // Asset-level summary
  summary: {
    totalUnits: number
    activeUnits: number
    offlineUnits: number
    maintenanceUnits: number
    averageEfficiency: number
    topPerformingUnit: string
    bottomPerformingUnit: string
  }
  
  // Constraints and issues
  constraints: {
    active: number
    critical: number
    bottlenecks: string[]
  }
  
  lastUpdated: string
}

interface AssetsResponse {
  assets: AssetData[]
  comparison: {
    eastVsWest: {
      productionDifference: number
      efficiencyDifference: number
      winner: 'east' | 'west' | 'tie'
    }
    systemTotal: {
      production: number
      capacity: number
      efficiency: number
    }
  }
}

interface UseAssetsOptions {
  enabled?: boolean
  refetchInterval?: number
}

/**
 * Fetch all assets data with East/West comparison
 * Primary hook for asset-level dashboards and comparisons
 */
export const useAssets = (options: UseAssetsOptions = {}): UseQueryResult<AssetsResponseParsed, Error> => {
  const [searchParams] = useSearchParams()
  
  const period = searchParams.get('period') || '24h'
  const includeUnits = searchParams.get('include_units') !== 'false'

  const {
    enabled = true,
    refetchInterval = 60000,
  } = options

  return useQuery({
    queryKey: ['assets', { period, includeUnits }],
    
    queryFn: async (): Promise<AssetsResponseParsed> => {
      const params = new URLSearchParams()
      if (period !== '24h') params.set('period', period)
      if (!includeUnits) params.set('include_units', 'false')

      const response = await apiClient.get<AssetsResponse>(`/assets?${params.toString()}`)
      return AssetsResponseSchema.parse(response.data)
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get specific asset data (East or West)
 * Used for individual asset dashboards
 */
export const useAsset = (
  assetId: 'east' | 'west' | undefined,
  options: UseAssetsOptions = {}
): UseQueryResult<AssetData, Error> => {
  const [searchParams] = useSearchParams()
  const period = searchParams.get('period') || '24h'

  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['asset', assetId, { period }],
    
    queryFn: async (): Promise<AssetData> => {
      if (!assetId) throw new Error('Asset ID is required')
      
      const params = new URLSearchParams()
      if (period !== '24h') params.set('period', period)

      const response = await apiClient.get<AssetData>(`/assets/${assetId}?${params.toString()}`)
      return response.data
    },

    enabled: enabled && Boolean(assetId),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get asset comparison metrics
 * Focused view for Performance Management Engineers
 */
export const useAssetComparison = (options: UseAssetsOptions = {}): UseQueryResult<AssetsResponse['comparison'], Error> => {
  const [searchParams] = useSearchParams()
  const period = searchParams.get('period') || '24h'

  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['assets', 'comparison', { period }],
    
    queryFn: async (): Promise<AssetsResponse['comparison']> => {
      const params = new URLSearchParams()
      if (period !== '24h') params.set('period', period)

      const response = await apiClient.get<AssetsResponse['comparison']>(`/assets/comparison?${params.toString()}`)
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 45000, // Comparison data can be less frequent
    gcTime: 15 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get production units for a specific asset
 * Used for drilling down into asset components
 */
export const useAssetProductionUnits = (
  assetId: 'east' | 'west' | undefined,
  options: UseAssetsOptions = {}
): UseQueryResult<ProductionUnit[], Error> => {
  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['asset', assetId, 'units'],
    
    queryFn: async (): Promise<ProductionUnit[]> => {
      if (!assetId) throw new Error('Asset ID is required')
      
      const response = await apiClient.get<ProductionUnit[]>(`/assets/${assetId}/units`)
      return response.data
    },

    enabled: enabled && Boolean(assetId),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 45000,
    gcTime: 10 * 60 * 1000,
    throwOnError: false,
  })
}

/**
 * Get top and bottom performing units across all assets
 * Used for performance ranking and optimization targeting
 */
export const useAssetPerformanceRanking = (options: UseAssetsOptions = {}): UseQueryResult<{
  topPerformers: (ProductionUnit & { assetId: 'east' | 'west' })[]
  bottomPerformers: (ProductionUnit & { assetId: 'east' | 'west' })[]
  averageMetrics: {
    efficiency: number
    production: number
  }
}, Error> => {
  const { enabled = true, refetchInterval = 60000 } = options

  return useQuery({
    queryKey: ['assets', 'performance-ranking'],
    
    queryFn: async () => {
      const response = await apiClient.get('/assets/performance-ranking')
      return response.data
    },

    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 60000, // Performance ranking can be less frequent
    gcTime: 20 * 60 * 1000,
    throwOnError: false,
  })
} 