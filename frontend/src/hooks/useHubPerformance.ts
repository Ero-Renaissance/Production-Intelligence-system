import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/axios'
import { HubPerformanceSchema, type HubPerformanceParsed } from '../types/schemas'

export const useHubPerformance = (assetId: 'east' | 'west' | undefined, hubId: string | undefined) => {
  return useQuery({
    queryKey: ['hub', assetId, hubId, 'performance'],
    enabled: Boolean(assetId && hubId),
    staleTime: 60000,
    refetchInterval: 120000,
    queryFn: async (): Promise<HubPerformanceParsed> => {
      if (!assetId || !hubId) throw new Error('assetId and hubId are required')
      const res = await apiClient.get(`/hub/${hubId}/performance?asset=${assetId}`)
      return HubPerformanceSchema.parse(res.data)
    }
  })
} 