/**
 * useSummary Hook
 * TRS Section 7: React Query data fetching for system summary KPIs
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import type { SummaryKpi } from '../types/api';
import { SummaryKpiSchema, type SummaryKpiParsed } from '../types/schemas';
import type { Timeframe } from '../components/TimeframeSelector/TimeframeSelector';

interface UseSummaryOptions {
  timeframe: Timeframe;
  customRange?: {
    start: Date;
    end: Date;
  };
}

export const useSummary = ({ timeframe, customRange }: UseSummaryOptions) => {
  return useQuery({
    queryKey: ['summary', timeframe, customRange],
    queryFn: async (): Promise<SummaryKpiParsed> => {
      const params = new URLSearchParams();
      params.set('timeframe', timeframe);
      
      if (timeframe === 'custom' && customRange) {
        params.set('start', customRange.start.toISOString());
        params.set('end', customRange.end.toISOString());
      }

      const response = await apiClient.get<SummaryKpi>(`/summary?${params.toString()}`);
      return SummaryKpiSchema.parse(response.data);
    },
  });
};

export const useAssetSummary = (assetId: 'east' | 'west') => {
  return useQuery({
    queryKey: ['summary', 'asset', assetId],
    queryFn: async (): Promise<SummaryKpiParsed> => {
      const response = await apiClient.get<SummaryKpi>(`/summary?asset=${assetId}`);
      return SummaryKpiSchema.parse(response.data);
    },
  });
}; 