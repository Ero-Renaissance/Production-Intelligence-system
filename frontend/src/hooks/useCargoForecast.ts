import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';

interface CargoSchedule {
  vesselName: string;
  scheduledDate: string;
  cargoSize: number;
  status: 'scheduled' | 'loading' | 'completed';
  destination?: string;
  loadingPort?: string;
}

export const useCargoForecast = () => {
  return useQuery({
    queryKey: ['cargoForecast'],
    queryFn: async (): Promise<CargoSchedule[]> => {
      const response = await apiClient.get<CargoSchedule[]>('/cargo-forecast');
      return response.data;
    },
    staleTime: 60000, // Consider data stale after 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}; 