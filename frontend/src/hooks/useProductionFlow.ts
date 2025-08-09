import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import { ProductionFlowSchema, type ProductionFlowParsed } from '../types/schemas';

interface ProductionFlowView {
  wells: Array<{ id: string; name: string; status: string; oilRate: number; gasRate: number; flowlineConnection: string }>;
  flowlines: Array<{ id: string; sourceId: string; destinationId: string; pressure: number; status: string }>;
  manifolds: Array<{ id: string; name: string; status: string; connectedFlowlines: string[]; outputConnections: { flowstations: string[]; gasPlants: string[] } }>;
  flowstations: Array<{ id: string; name: string; status: string; throughput: number; compressorConnections: string[]; pipelineConnections: string[] }>;
  gasPlants: Array<{ id: string; name: string; status: string; salesGas: number; pipelineConnections: string[] }>;
  compressorStations: Array<{ id: string; name: string; status: string; throughput: number; destinationNetwork: string }>;
  pipelines: Array<{ id: string; sourceId: string; destinationId: string; maxCapacity: number; currentThroughput: number; product: 'oil' | 'gas'; status: string }>;
  terminals: Array<{ id: string; name: string; inventory: number; maxCapacity: number; loadingRate: number; status: string }>;
  receivingPoints: Array<{ id: string; name: string; type: 'domestic-customer' | 'export-customer'; landingPressure: number; contractedRate: number; status: string }>;
}

export const useProductionFlow = (assetId?: 'east' | 'west') => {
  return useQuery({
    queryKey: ['productionFlow', assetId],
    queryFn: async (): Promise<ProductionFlowView> => {
      const params = new URLSearchParams();
      if (assetId) {
        params.set('asset', assetId);
      }
      
      const response = await apiClient.get(`/production-flow?${params.toString()}`);
      const parsed: ProductionFlowParsed = ProductionFlowSchema.parse(response.data);

      // Map topology to legacy view model expected by ProductionFlowMap
      const facilitiesByType = parsed.facilities
        .filter(f => !assetId || parsed.units.find(u => u.id === f.unitId)?.assetId === assetId)
        .reduce<Record<'flowstation' | 'compressor-station' | 'gas-plant' | 'terminal', typeof parsed.facilities>>(
          (acc, f) => {
            const key = f.type;
            if (!acc[key]) acc[key] = [] as unknown as typeof parsed.facilities;
            (acc[key] as unknown as typeof parsed.facilities).push(f);
            return acc;
          },
          {
            'flowstation': [] as unknown as typeof parsed.facilities,
            'compressor-station': [] as unknown as typeof parsed.facilities,
            'gas-plant': [] as unknown as typeof parsed.facilities,
            'terminal': [] as unknown as typeof parsed.facilities,
          }
        );

      const flowstations = (facilitiesByType['flowstation'] || []).map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        throughput: (f.networks?.oil?.currentProduction ?? 0),
        compressorConnections: [],
        pipelineConnections: [],
      }));

      const compressorStations = (facilitiesByType['compressor-station'] || []).map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        throughput: (f.networks?.domesticGas?.currentProduction ?? f.networks?.exportGas?.currentProduction ?? 0),
        destinationNetwork: f.networks?.exportGas ? 'export' : 'domestic',
      }));

      const gasPlants = (facilitiesByType['gas-plant'] || []).map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        salesGas: (f.networks?.exportGas?.currentProduction ?? f.networks?.domesticGas?.currentProduction ?? 0),
        pipelineConnections: [],
      }));

      const terminals = (facilitiesByType['terminal'] || []).map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        inventory: 0,
        maxCapacity: 0,
        loadingRate: 0,
      }));

      const pipelines = parsed.edges.map(e => ({
        id: `${e.sourceId}-${e.targetId}`,
        sourceId: e.sourceId,
        destinationId: e.targetId,
        maxCapacity: e.maxCapacity,
        currentThroughput: e.currentThroughput,
        product: e.product,
        status: e.status,
      }));

      const view: ProductionFlowView = {
        wells: [],
        flowlines: [],
        manifolds: [],
        flowstations,
        gasPlants,
        compressorStations,
        pipelines,
        terminals,
        receivingPoints: [],
      };

      return view;
    },
    staleTime: 30000, // Consider data stale after 30s
    refetchInterval: 60000, // Refetch every minute
    retry: 3, // Add retries for reliability
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}; 