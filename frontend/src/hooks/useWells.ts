import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import type { WellListRow, WellDetail, WellTimeseriesPoint } from '../types/api';

export const useFacilityWells = (
  facilityId: string | undefined,
  opts: { enabled?: boolean; network?: 'oil' | 'domesticGas' | 'exportGas' } = {}
): UseQueryResult<WellListRow[], Error> => {
  const { enabled = true, network } = opts;

  return useQuery({
    queryKey: ['facility-wells', facilityId, { network }],
    queryFn: async (): Promise<WellListRow[]> => {
      if (!facilityId) throw new Error('facilityId is required');
      const params = new URLSearchParams();
      if (network) params.set('network', network);
      const res = await apiClient.get<WellListRow[]>(`/facilities/${facilityId}/wells?${params.toString()}`);
      return res.data;
    },
    enabled: enabled && Boolean(facilityId),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
};

export const useWellDetail = (
  wellId: string | undefined,
  opts: { enabled?: boolean } = {}
): UseQueryResult<WellDetail, Error> => {
  const { enabled = true } = opts;

  return useQuery({
    queryKey: ['well-detail', wellId],
    queryFn: async (): Promise<WellDetail> => {
      if (!wellId) throw new Error('wellId is required');
      const res = await apiClient.get<WellDetail>(`/wells/${wellId}`);
      return res.data;
    },
    enabled: enabled && Boolean(wellId),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
};

export const useWellTimeseries = (
  wellId: string | undefined,
  params: { start?: string; end?: string; interval?: string } = {},
  opts: { enabled?: boolean; refetchInterval?: number } = {}
): UseQueryResult<WellTimeseriesPoint[], Error> => {
  const { enabled = true, refetchInterval = 30_000 } = opts;
  const { start, end, interval } = params;

  return useQuery({
    queryKey: ['well-timeseries', wellId, { start, end, interval }],
    queryFn: async (): Promise<WellTimeseriesPoint[]> => {
      if (!wellId) throw new Error('wellId is required');
      const sp = new URLSearchParams();
      if (start) sp.set('start', start);
      if (end) sp.set('end', end);
      if (interval) sp.set('interval', interval);
      const res = await apiClient.get<WellTimeseriesPoint[]>(`/wells/${wellId}/timeseries?${sp.toString()}`);
      return res.data;
    },
    enabled: enabled && Boolean(wellId),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  });
}; 