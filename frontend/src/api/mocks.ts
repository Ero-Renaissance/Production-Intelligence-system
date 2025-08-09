/**
 * Mock Service Worker Request Handlers
 * Following TRS Section 4 specifications
 * 
 * Handles all REST endpoints:
 * - GET /api/nodes
 * - GET /api/summary  
 * - GET /api/gap-drivers
 * - GET /api/cargo-forecast
 * - GET /api/constraints?stream=...
 * - GET /api/optimisations?stream=...
 * - PATCH /api/optimisations/:id (for status updates)
 */

import { http, HttpResponse } from 'msw';
import type {
  NodeKpi,
  SummaryKpi,
  GapDriver,
  CargoForecastPoint,
  ConstraintEvent,
  OptimisationAction,
  SecureApiResponse,
  ConstraintsQuery,
  OptimisationsQuery,
  UpdateOptimisationRequest,
  StreamType,
} from '../types/api';

// =============================================================================
// MOCK DATA STRUCTURE INTERFACE
// =============================================================================

/**
 * Interface for the complete mock data structure
 */
interface MockDataStructure {
  nodes: NodeKpi[];
  summary: SummaryKpi | null;
  gapDrivers: GapDriver[];
  cargoForecast: CargoForecastPoint[];
  constraints: ConstraintEvent[];
  optimisations: OptimisationAction[];
  [key: string]: unknown;
}

// =============================================================================
// MOCK DATA LOADING
// =============================================================================

/**
 * Load mock data from public/mock-data.json
 */
const loadMockData = async (): Promise<MockDataStructure> => {
  try {
    const response = await fetch('/mock-data.json');
    if (!response.ok) {
      throw new Error('Failed to load mock data');
    }
    return await response.json() as MockDataStructure;
  } catch (error) {
    console.error('Error loading mock data:', error);
    // Fallback to empty data structure
    return {
      nodes: [],
      summary: null,
      gapDrivers: [],
      cargoForecast: [],
      constraints: [],
      optimisations: [],
    };
  }
};

// Cache for mock data
let mockDataCache: MockDataStructure | null = null;

/**
 * Get cached mock data or load if not available
 */
const getMockData = async (): Promise<MockDataStructure> => {
  if (!mockDataCache) {
    mockDataCache = await loadMockData();
  }
  return mockDataCache;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create secure API response wrapper
 */
const createSecureResponse = <T>(data: T): SecureApiResponse<T> => ({
  data,
  timestamp: new Date().toISOString(),
  success: true,
});

/**
 * Add realistic network delay for development
 */
const networkDelay = () => {
  const delay = Math.random() * 500 + 100; // 100-600ms
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Filter constraints by query parameters
 */
const filterConstraints = (constraints: ConstraintEvent[], query: ConstraintsQuery) => {
  let filtered = [...constraints];
  
  if (query.stream) {
    filtered = filtered.filter(c => c.stream === query.stream);
  }
  
  if (query.severity) {
    filtered = filtered.filter(c => c.severity === query.severity);
  }
  
  if (query.nodeId) {
    filtered = filtered.filter(c => c.nodeId === query.nodeId);
  }
  
  // Apply pagination
  const offset = query.offset || 0;
  const limit = query.limit || 50;
  
  return filtered.slice(offset, offset + limit);
};

/**
 * Filter optimisations by query parameters
 */
const filterOptimisations = (optimisations: OptimisationAction[], query: OptimisationsQuery) => {
  let filtered = [...optimisations];
  
  if (query.stream) {
    filtered = filtered.filter(o => o.stream === query.stream);
  }
  
  if (query.status) {
    filtered = filtered.filter(o => o.status === query.status);
  }
  
  if (query.priority) {
    const priorityMap = { low: [1, 3], medium: [4, 6], high: [7, 10] };
    const range = priorityMap[query.priority];
    if (range) {
      filtered = filtered.filter(o => o.priority >= range[0] && o.priority <= range[1]);
    }
  }
  
  // Apply pagination
  const offset = query.offset || 0;
  const limit = query.limit || 50;
  
  return filtered.slice(offset, offset + limit);
};

// =============================================================================
// REQUEST HANDLERS
// =============================================================================

export const handlers = [
  
  // =========================================================================
  // GET /api/nodes - Production nodes KPIs
  // =========================================================================
  http.get('/api/nodes', async () => {
    console.log('🔥 MSW: /api/nodes handler called!');
    await networkDelay();
    
    // Return NodeKpi array with correct structure
    const mockNodes = [
      {
        id: 'east-well-001',
        name: 'East Well 001',
        type: 'well' as const,
        constraintLevel: 'warning' as const,
        throughput: {
          current: 2500,
          capacity: 3000,
          unit: 'bbl/d',
          efficiency: 83.3
        },
        streams: {
          oil: {
            rate: 2500,
            unit: 'bbl/d'
          }
        },
        location: {
          lat: 28.5,
          lng: -96.8,
          region: 'East Field'
        },
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'east-flowstation-01',
        name: 'East Flow Station 01',
        type: 'facility' as const,
        constraintLevel: 'normal' as const,
        throughput: {
          current: 15000,
          capacity: 18000,
          unit: 'bbl/d',
          efficiency: 89.1
        },
        streams: {
          oil: {
            rate: 12000,
            unit: 'bbl/d'
          },
          exportGas: {
            rate: 25000,
            unit: 'mcf/d'
          }
        },
        location: {
          lat: 28.6,
          lng: -96.7,
          region: 'East Field'
        },
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'west-well-001',
        name: 'West Well 001',
        type: 'well' as const,
        constraintLevel: 'normal' as const,
        throughput: {
          current: 2200,
          capacity: 2800,
          unit: 'bbl/d',
          efficiency: 78.6
        },
        streams: {
          oil: {
            rate: 2200,
            unit: 'bbl/d'
          }
        },
        location: {
          lat: 28.4,
          lng: -96.9,
          region: 'West Field'
        },
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'west-compressor-01',
        name: 'West Compressor 01',
        type: 'facility' as const,
        constraintLevel: 'warning' as const,
        throughput: {
          current: 80000,
          capacity: 100000,
          unit: 'mcf/d',
          efficiency: 75.2
        },
        streams: {
          exportGas: {
            rate: 65000,
            unit: 'mcf/d'
          },
          domesticGas: {
            rate: 15000,
            unit: 'mcf/d'
          }
        },
        location: {
          lat: 28.3,
          lng: -96.8,
          region: 'West Field'
        },
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'main-pipeline-01',
        name: 'Main Pipeline 01',
        type: 'pipeline' as const,
        constraintLevel: 'critical' as const,
        throughput: {
          current: 45000,
          capacity: 50000,
          unit: 'bbl/d',
          efficiency: 90.0
        },
        streams: {
          oil: {
            rate: 45000,
            unit: 'bbl/d'
          }
        },
        location: {
          lat: 28.5,
          lng: -96.6,
          region: 'Main System'
        },
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'export-terminal-01',
        name: 'Export Terminal 01',
        type: 'receiving-node' as const,
        constraintLevel: 'normal' as const,
        throughput: {
          current: 43000,
          capacity: 60000,
          unit: 'bbl/d',
          efficiency: 86.7
        },
        streams: {
          oil: {
            rate: 43000,
            unit: 'bbl/d'
          }
        },
        location: {
          lat: 28.7,
          lng: -96.5,
          region: 'Terminal'
        },
        lastUpdated: new Date().toISOString()
      }
    ];
    
    const response = createSecureResponse(mockNodes);
    
    console.log('📊 Mock API: GET /api/nodes', response.data.length, 'nodes');
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // GET /api/summary - System summary KPIs
  // =========================================================================
  http.get('/api/summary', async ({ request }) => {
    console.log('🔥 MSW: /api/summary handler called!');
    await networkDelay();

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'mtd';
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');

    console.log('📊 Timeframe:', { timeframe, startDate, endDate });
    
    const summaryData = {
      systemHealth: {
        nodesOnline: 11,
        totalNodes: 13,
        criticalIssues: 1,
        warningIssues: 3
      },
      
      assets: {
        east: {
          currentProduction: 45000,
          capacity: 55000,
          status: 'normal' as const,
          activeUnits: 11,
          totalUnits: 12,
          trend: 'up' as const,
          changePercent: 2.1,
          networks: {
            oil: {
              maxCapacity: 55000,
              businessTarget: 50000,
              currentProduction: 45000,
              deferment: 10000,
              unit: 'bbl/d',
              trend: 'up' as const,
              changePercent: 2.1,
            },
            domesticGas: {
              maxCapacity: 60000,
              businessTarget: 54000,
              currentProduction: 52000,
              deferment: 8000,
              unit: 'mcf/d',
              trend: 'stable' as const,
              changePercent: 0.3,
            },
            exportGas: {
              maxCapacity: 90000,
              businessTarget: 80000,
              currentProduction: 75000,
              deferment: 15000,
              unit: 'mcf/d',
              trend: 'up' as const,
              changePercent: 1.8,
            },
            flaredGas: {
              maxCapacity: 3000,
              businessTarget: 1000,
              currentProduction: 1500,
              deferment: 500,
              unit: 'mcf/d',
              trend: 'up' as const,
              changePercent: 1.2,
            }
          }
        },
        west: {
          currentProduction: 38000,
          capacity: 50000,
          status: 'warning' as const,
          activeUnits: 9,
          totalUnits: 10,
          trend: 'down' as const,
          changePercent: -1.3,
          networks: {
            oil: {
              maxCapacity: 50000,
              businessTarget: 42000,
              currentProduction: 38000,
              deferment: 12000,
              unit: 'bbl/d',
              trend: 'down' as const,
              changePercent: -1.3,
            },
            domesticGas: {
              maxCapacity: 40000,
              businessTarget: 36000,
              currentProduction: 33000,
              deferment: 7000,
              unit: 'mcf/d',
              trend: 'down' as const,
              changePercent: -1.2,
            },
            exportGas: {
              maxCapacity: 60000,
              businessTarget: 52000,
              currentProduction: 45000,
              deferment: 15000,
              unit: 'mcf/d',
              trend: 'stable' as const,
              changePercent: 0.2,
            },
            flaredGas: {
              maxCapacity: 2500,
              businessTarget: 900,
              currentProduction: 1400,
              deferment: 600,
              unit: 'mcf/d',
              trend: 'up' as const,
              changePercent: 1.2,
            }
          }
        }
      },
      
      lastUpdated: new Date().toISOString()
    };

    const response = createSecureResponse(summaryData);
    console.log('🔒 MSW Wrapped Response:', response);
    
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // GET /api/gap-drivers - Production gap analysis
  // =========================================================================
  http.get('/api/gap-drivers', async ({ request }) => {
    await networkDelay();
    
    // Helper to map network key to stream type used by GapDriver
    const toStream = (key: 'oil' | 'domesticGas' | 'exportGas' | 'flaredGas'): StreamType | null => {
      if (key === 'oil') return 'oil';
      if (key === 'domesticGas') return 'domestic-gas';
      if (key === 'exportGas') return 'export-gas';
      return null; // flaredGas not a producible stream for transport/export
    };

    type NetworkKey = 'oil' | 'domesticGas' | 'exportGas' | 'flaredGas';
    type BasicNetMetrics = { maxCapacity?: number; deferment?: number; unit?: string };
    type FacilityNet = {
      id: string;
      name: string;
      type: 'flowstation' | 'compressor-station' | 'gas-plant' | 'terminal';
      networks?: Partial<Record<NetworkKey, BasicNetMetrics>>;
    };

    const url = new URL(request.url);
    const assetFilter = (url.searchParams.get('asset') as 'east' | 'west' | null) || null;

    // Minimal view of facilities with networks based on the assets mocks above
    const assets: Array<{
      assetId: 'east' | 'west';
      units: Array<{
        unitId: string;
        unitName: string;
        facilities: FacilityNet[];
      }>;
    }> = [
      {
        assetId: 'east',
        units: [
          {
            unitId: 'east-production-unit-01',
            unitName: 'Soku Production Unit',
            facilities: [
              {
                id: 'flowstation-001',
                name: 'East Flowstation 001',
                type: 'flowstation',
                networks: {
                  oil: { maxCapacity: 5000, deferment: 1200, unit: 'bbl/d' },
                  flaredGas: { deferment: 300, unit: 'mcf/d' },
                },
              },
              {
                id: 'compressor-001',
                name: 'East Compressor 001',
                type: 'compressor-station',
                networks: {
                  domesticGas: { maxCapacity: 4000, deferment: 700, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 6000, deferment: 1500, unit: 'mcf/d' },
                  flaredGas: { deferment: 200, unit: 'mcf/d' },
                },
              },
              {
                id: 'gasplant-001',
                name: 'East Gas Plant 001',
                type: 'gas-plant',
                networks: {
                  domesticGas: { maxCapacity: 4200, deferment: 700, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 6500, deferment: 1300, unit: 'mcf/d' },
                  flaredGas: { maxCapacity: 1500, deferment: 600, unit: 'mcf/d' },
                },
              },
            ],
          },
          {
            unitId: 'east-production-unit-02',
            unitName: 'Gbaran',
            facilities: [
              {
                id: 'flowstation-002',
                name: 'East Flowstation 002',
                type: 'flowstation',
                networks: {
                  oil: { maxCapacity: 50000, deferment: 12000, unit: 'bbl/d' },
                  flaredGas: { deferment: 400, unit: 'mcf/d' },
                },
              },
              {
                id: 'compressor-002',
                name: 'East Compressor 002',
                type: 'compressor-station',
                networks: {
                  domesticGas: { maxCapacity: 40000, deferment: 7000, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 60000, deferment: 15000, unit: 'mcf/d' },
                  flaredGas: { deferment: 400, unit: 'mcf/d' },
                },
              },
              {
                id: 'gasplant-002',
                name: 'East Gas Plant 002',
                type: 'gas-plant',
                networks: {
                  domesticGas: { maxCapacity: 48000, deferment: 9000, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 75000, deferment: 15000, unit: 'mcf/d' },
                  flaredGas: { maxCapacity: 1600, deferment: 650, unit: 'mcf/d' },
                },
              },
            ],
          },
        ],
      },
      {
        assetId: 'west',
        units: [
          {
            unitId: 'west-production-unit-01',
            unitName: 'Forcados',
            facilities: [
              {
                id: 'flowstation-101',
                name: 'West Flowstation 101',
                type: 'flowstation',
                networks: {
                  oil: { maxCapacity: 60000, deferment: 18000, unit: 'bbl/d' },
                  flaredGas: { deferment: 250, unit: 'mcf/d' },
                },
              },
              {
                id: 'compressor-101',
                name: 'West Compressor 101',
                type: 'compressor-station',
                networks: {
                  domesticGas: { maxCapacity: 38000, deferment: 8000, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 58000, deferment: 15000, unit: 'mcf/d' },
                  flaredGas: { deferment: 250, unit: 'mcf/d' },
                },
              },
              {
                id: 'gasplant-101',
                name: 'West Gas Plant 101',
                type: 'gas-plant',
                networks: {
                  domesticGas: { maxCapacity: 42000, deferment: 7000, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 60000, deferment: 15000, unit: 'mcf/d' },
                  flaredGas: { maxCapacity: 1200, deferment: 300, unit: 'mcf/d' },
                },
              },
            ],
          },
          {
            unitId: 'west-production-unit-02',
            unitName: 'Outumara',
            facilities: [
              {
                id: 'flowstation-201',
                name: 'West Flowstation 201',
                type: 'flowstation',
                networks: {
                  oil: { maxCapacity: 52000, deferment: 13000, unit: 'bbl/d' },
                  flaredGas: { deferment: 300, unit: 'mcf/d' },
                },
              },
              {
                id: 'compressor-201',
                name: 'West Compressor 201',
                type: 'compressor-station',
                networks: {
                  domesticGas: { maxCapacity: 35000, deferment: 5000, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 52000, deferment: 9000, unit: 'mcf/d' },
                  flaredGas: { deferment: 300, unit: 'mcf/d' },
                },
              },
              {
                id: 'gasplant-201',
                name: 'West Gas Plant 201',
                type: 'gas-plant',
                networks: {
                  domesticGas: { maxCapacity: 40000, deferment: 7000, unit: 'mcf/d' },
                  exportGas: { maxCapacity: 58000, deferment: 13000, unit: 'mcf/d' },
                  flaredGas: { maxCapacity: 1100, deferment: 300, unit: 'mcf/d' },
                },
              },
            ],
          },
        ],
      },
    ];

    const drivers: GapDriver[] = [];

    const now = Date.now();
    const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

    for (const asset of assets) {
      if (assetFilter && asset.assetId !== assetFilter) continue;
      for (const unit of asset.units) {
        for (const fac of unit.facilities) {
          const nets = fac.networks || {};
          for (const key of Object.keys(nets) as NetworkKey[]) {
            const metrics = nets[key] as BasicNetMetrics;
            const lost = Math.max(0, Math.floor(metrics.deferment ?? 0));
            const unitStr = metrics.unit || (key === 'oil' ? 'bbl/d' : 'mcf/d');
            const stream = toStream(key);
            if (!lost || !stream) continue; // skip 0 losses and flaredGas for stream list

            const capacity = metrics.maxCapacity ?? (key === 'oil' ? 5000 : 50000);
            const percentage = capacity > 0 ? (lost / capacity) * 100 : 0;

            // Priority bucketing
            const priority: GapDriver['priority'] = percentage >= 30
              ? 'critical'
              : percentage >= 20
                ? 'high'
                : percentage >= 10
                  ? 'medium'
                  : 'low';

            // Gap type heuristic by facility type
            const gapType: GapDriver['gapType'] =
              fac.type === 'compressor-station' ? 'maintenance' :
              fac.type === 'gas-plant' ? 'efficiency' :
              'constraint';

            drivers.push({
              id: `gap-${asset.assetId}-${unit.unitId}-${fac.id}-${key}`,
              nodeId: fac.id,
              nodeName: `${fac.name}`,
              gapType,
              description: `${fac.type.replace('-', ' ')} impacting ${key.replace('Gas',' Gas')} throughput`,
              impact: {
                lostProduction: lost,
                unit: unitStr,
                percentage: Number(percentage.toFixed(1)),
              },
              affectedStreams: [stream],
              duration: {
                start: hoursAgo(24 + Math.floor(Math.random() * 72)),
                totalHours: 12 + Math.floor(percentage),
              },
              priority,
              status: 'active',
              lastUpdated: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Sort by impact and cap list to top 12
    drivers.sort((a, b) => b.impact.lostProduction - a.impact.lostProduction);
    const topDrivers = drivers.slice(0, 12);

    const response = createSecureResponse<GapDriver[]>(topDrivers);
    console.log('🔍 Mock API: GET /api/gap-drivers', response.data.length, 'gaps');
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // GET /api/cargo-forecast - Cargo shipment forecasts
  // =========================================================================
  http.get('/api/cargo-forecast', async () => {
    await networkDelay();
    
    const mockData = await getMockData();
    const response = createSecureResponse<CargoForecastPoint[]>(mockData.cargoForecast || []);
    
    console.log('🚢 Mock API: GET /api/cargo-forecast', response.data.length, 'forecasts');
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // GET /api/constraints - Real-time constraint events
  // =========================================================================
  http.get('/api/constraints', async ({ request }) => {
    await networkDelay();
    
    const url = new URL(request.url);
    const query: ConstraintsQuery = {
      stream: url.searchParams.get('stream') as StreamType || undefined,
      severity: url.searchParams.get('severity') as 'info' | 'warning' | 'critical' || undefined,
      nodeId: url.searchParams.get('nodeId') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };
    
    const mockData = await getMockData();
    const filtered = filterConstraints(mockData.constraints || [], query);
    const response = createSecureResponse<ConstraintEvent[]>(filtered);
    
    console.log('⚠️ Mock API: GET /api/constraints', {
      query,
      results: response.data.length
    });
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // GET /api/production-flow - Topology: units, facilities, edges
  // =========================================================================
  http.get('/api/production-flow', async () => {
    console.log('🔥 MSW: /api/production-flow handler called!');
    await networkDelay();

    const topology = {
      units: [
        { id: 'east-production-unit-01', name: 'Soku Production Unit', assetId: 'east' },
        { id: 'east-production-unit-02', name: 'Gbaran', assetId: 'east' },
        { id: 'west-production-unit-01', name: 'Forcados', assetId: 'west' },
        { id: 'west-production-unit-02', name: 'Otumara', assetId: 'west' }
      ],
      facilities: [
        {
          id: 'flowstation-001',
          name: 'East Flow Station 01',
          type: 'flowstation',
          unitId: 'east-production-unit-01',
          status: 'online',
          networks: {
            oil: {
              maxCapacity: 18000,
              businessTarget: 16000,
              currentProduction: 15000,
              deferment: 3000,
              unit: 'bbl/d',
              trend: 'stable',
              changePercent: 0.5,
            },
          },
        },
        {
          id: 'compressor-001',
          name: 'East Compressor 01',
          type: 'compressor-station',
          unitId: 'east-production-unit-01',
          status: 'online',
          networks: {
            domesticGas: {
              maxCapacity: 40000,
              businessTarget: 36000,
              currentProduction: 30000,
              deferment: 10000,
              unit: 'mcf/d',
              trend: 'down',
              changePercent: -1.2,
            },
            exportGas: {
              maxCapacity: 60000,
              businessTarget: 52000,
              currentProduction: 45000,
              deferment: 15000,
              unit: 'mcf/d',
              trend: 'stable',
              changePercent: 0.2,
            },
          },
        },
        {
          id: 'gasplant-001',
          name: 'East Gas Plant 01',
          type: 'gas-plant',
          unitId: 'east-production-unit-01',
          status: 'online',
          networks: {
            domesticGas: {
              maxCapacity: 45000,
              businessTarget: 42000,
              currentProduction: 38000,
              deferment: 7000,
              unit: 'mcf/d',
              trend: 'up',
              changePercent: 0.8,
            },
            exportGas: {
              maxCapacity: 70000,
              businessTarget: 62000,
              currentProduction: 58000,
              deferment: 12000,
              unit: 'mcf/d',
              trend: 'stable',
              changePercent: 0.4,
            },
          },
        },
        { id: 'terminal-001', name: 'Export Terminal 01', type: 'terminal', unitId: 'east-production-unit-01', status: 'online' },
        {
          id: 'flowstation-002',
          name: 'East Flow Station 02',
          type: 'flowstation',
          unitId: 'east-production-unit-02',
          status: 'online',
          networks: {
            oil: {
              maxCapacity: 20000,
              businessTarget: 17000,
              currentProduction: 16000,
              deferment: 4000,
              unit: 'bbl/d',
              trend: 'up',
              changePercent: 1.0,
            },
          },
        },
        {
          id: 'compressor-002',
          name: 'East Compressor 02',
          type: 'compressor-station',
          unitId: 'east-production-unit-02',
          status: 'online',
          networks: {
            domesticGas: {
              maxCapacity: 42000,
              businessTarget: 38000,
              currentProduction: 32000,
              deferment: 10000,
              unit: 'mcf/d',
              trend: 'down',
              changePercent: -0.9,
            },
            exportGas: {
              maxCapacity: 62000,
              businessTarget: 56000,
              currentProduction: 50000,
              deferment: 12000,
              unit: 'mcf/d',
              trend: 'stable',
              changePercent: 0.3,
            },
          },
        },
        {
          id: 'gasplant-002',
          name: 'East Gas Plant 02',
          type: 'gas-plant',
          unitId: 'east-production-unit-02',
          status: 'online',
          networks: {
            domesticGas: {
              maxCapacity: 48000,
              businessTarget: 44000,
              currentProduction: 39000,
              deferment: 9000,
              unit: 'mcf/d',
              trend: 'up',
              changePercent: 0.6,
            },
            exportGas: {
              maxCapacity: 75000,
              businessTarget: 68000,
              currentProduction: 60000,
              deferment: 15000,
              unit: 'mcf/d',
              trend: 'up',
              changePercent: 0.7,
            },
          },
        },
        {
          id: 'flowstation-101',
          name: 'West Flow Station 01',
          type: 'flowstation',
          unitId: 'west-production-unit-01',
          status: 'online',
          networks: {
            oil: {
              maxCapacity: 60000,
              businessTarget: 52000,
              currentProduction: 42000,
              deferment: 18000,
              unit: 'bbl/d',
              trend: 'down',
              changePercent: -1.1,
            },
          },
        },
        {
          id: 'compressor-101',
          name: 'West Compressor 01',
          type: 'compressor-station',
          unitId: 'west-production-unit-01',
          status: 'online',
          networks: {
            domesticGas: {
              maxCapacity: 38000,
              businessTarget: 34000,
              currentProduction: 30000,
              deferment: 8000,
              unit: 'mcf/d',
              trend: 'down',
              changePercent: -1.0,
            },
            exportGas: {
              maxCapacity: 58000,
              businessTarget: 52000,
              currentProduction: 43000,
              deferment: 15000,
              unit: 'mcf/d',
              trend: 'stable',
              changePercent: 0.1,
            },
          },
        },
        {
          id: 'gasplant-101',
          name: 'West Gas Plant 01',
          type: 'gas-plant',
          unitId: 'west-production-unit-01',
          status: 'online',
          networks: {
            domesticGas: {
              maxCapacity: 42000,
              businessTarget: 36000,
              currentProduction: 33000,
              deferment: 7000,
              unit: 'mcf/d',
              trend: 'down',
              changePercent: -0.8,
            },
            exportGas: {
              maxCapacity: 60000,
              businessTarget: 52000,
              currentProduction: 45000,
              deferment: 15000,
              unit: 'mcf/d',
              trend: 'stable',
              changePercent: 0.2,
            },
          },
        },
        { id: 'terminal-101', name: 'Forcados Terminal', type: 'terminal', unitId: 'west-production-unit-01', status: 'operational' },
      ],
      edges: [
        { sourceId: 'flowstation-001', targetId: 'terminal-001', product: 'oil', maxCapacity: 50000, currentThroughput: 45000, status: 'online' },
        { sourceId: 'compressor-001', targetId: 'gasplant-001', product: 'gas', maxCapacity: 100000, currentThroughput: 85000, status: 'online' },
        { sourceId: 'flowstation-101', targetId: 'terminal-101', product: 'oil', maxCapacity: 60000, currentThroughput: 42000, status: 'online' },
      ],
    };

    const response = createSecureResponse(topology);
    console.log('🏭 Mock API: GET /api/production-flow', response);
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // GET /api/optimisations - AI-generated optimization actions
  // =========================================================================
  http.get('/api/optimisations', async ({ request }) => {
    await networkDelay();
    
    const url = new URL(request.url);
    const query: OptimisationsQuery = {
      stream: url.searchParams.get('stream') as StreamType || undefined,
      status: url.searchParams.get('status') as OptimisationAction['status'] || undefined,
      priority: url.searchParams.get('priority') as 'low' | 'medium' | 'high' || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };
    
    const mockData = await getMockData();
    const filtered = filterOptimisations(mockData.optimisations || [], query);
    const response = createSecureResponse<OptimisationAction[]>(filtered);
    
    console.log('🎯 Mock API: GET /api/optimisations', {
      query,
      results: response.data.length
    });
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // PATCH /api/optimisations/:id - Update optimization status
  // =========================================================================
  http.patch('/api/optimisations/:id', async ({ request, params }) => {
    await networkDelay();
    
    const { id } = params;
    
    // Parse and validate request body
    let updateRequest: UpdateOptimisationRequest;
    try {
      const body = await request.json();
      updateRequest = body as UpdateOptimisationRequest;
      
      // Basic validation
      if (!updateRequest.status) {
        return HttpResponse.json(
          { message: 'Status is required', code: 'INVALID_REQUEST', timestamp: new Date().toISOString() },
          { status: 400 }
        );
      }
    } catch (error) {
      return HttpResponse.json(
        { message: 'Invalid JSON body', code: 'INVALID_JSON', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }
    
    const mockData = await getMockData();
    const optimisation = mockData.optimisations?.find((o: OptimisationAction) => o.id === id);
    
    if (!optimisation) {
      return HttpResponse.json(
        { message: 'Optimisation not found', code: 'NOT_FOUND', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }
    
    // Update the optimisation status
    optimisation.status = updateRequest.status;
    
    const response = createSecureResponse<OptimisationAction>(optimisation);
    
    console.log('✅ Mock API: PATCH /api/optimisations/:id', {
      id,
      newStatus: updateRequest.status
    });
    return HttpResponse.json(response);
  }),

  // =========================================================================
  // Health Check Endpoint
  // =========================================================================
  http.get('/api/health', async () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-mock'
    });
  }),

  // =========================================================================
  // ENHANCED ENDPOINTS (Added for Phase 5A User Requirements)
  // =========================================================================

  // GET /api/assets - Asset hierarchy data (East/West)
  http.get('/api/assets', async ({ request }) => {
    console.log('🔥 MSW: /api/assets handler called!');
    await networkDelay();
    
    const url = new URL(request.url);
    const includeUnits = url.searchParams.get('include_units') !== 'false';

    // Mock asset data structure
    const assetsResponse = {
      assets: [
        {
          id: 'east',
          name: 'East Asset',
          status: 'normal',
          performance: {
            currentProduction: 45000,
            capacity: 55000,
            businessTarget:50000,
            deferment:5000,
            trend: 'stable',
            changePercent: 2.1
          },
          productionUnits: includeUnits ? [
            {
              id: 'east-production-unit-01',
              name: 'Soku Production Unit',
              status: 'online',
              equipmentCount: 8,
              activeEquipment: 7,
              lastUpdated: new Date().toISOString(),
              facilities: [
                {
                  id: 'flowstation-001',
                  type: 'flowstation',
                  networks: {
                    oil: {
                      maxCapacity: 5000,
                      businessTarget: 4200,
                      currentProduction: 3800,
                      deferment: 1200,
                      unit: 'bbl/d',
                      trend: 'down',
                      changePercent: -1.3,
                    },
                    flaredGas: {
                      maxCapacity: 800,
                      businessTarget: 600,
                      currentProduction: 500,
                      deferment: 300,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.0,
                    },
                  },
                },
                {
                  id: 'compressor-001',
                  type: 'compressor-station',
                  networks: {
                    domesticGas: {
                      maxCapacity: 4000,
                      businessTarget: 3600,
                      currentProduction: 3300,
                      deferment: 700,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -1.2,
                    },
                    exportGas: {
                      maxCapacity: 6000,
                      businessTarget: 5200,
                      currentProduction: 4500,
                      deferment: 1500,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.2,
                    },
                    flaredGas: {
                      maxCapacity: 600,
                      businessTarget: 400,
                      currentProduction: 300,
                      deferment: 200,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -0.2,
                    },
                  },
                },
                {
                  id: 'gasplant-001',
                  type: 'gas-plant',
                  networks: {
                    domesticGas: {
                      maxCapacity: 4200,
                      businessTarget: 3800,
                      currentProduction: 3500,
                      deferment: 700,
                      unit: 'mcf/d',
                      trend: 'up',
                      changePercent: 0.5,
                    },
                    exportGas: {
                      maxCapacity: 6500,
                      businessTarget: 6000,
                      currentProduction: 5200,
                      deferment: 1300,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.1,
                    },
                    flaredGas: {
                      maxCapacity: 1500,
                      businessTarget: 1000,
                      currentProduction: 900,
                      deferment: 600,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -0.2,
                    },
                  },
                },
                { id: 'terminal-001', type: 'terminal' }
              ],
              networks: {
                oil: {
                  maxCapacity: 5000,
                  businessTarget: 4200,
                  currentProduction: 3800,
                  deferment: 1200,
                  unit: 'bbl/d',
                  trend: 'down' as const,
                  changePercent: -1.3,
                },
                domesticGas: {
                  maxCapacity: 4000,
                  businessTarget: 3600,
                  currentProduction: 3300,
                  deferment: 700,
                  unit: 'mcf/d',
                  trend: 'down' as const,
                  changePercent: -1.2,
                },
                exportGas: {
                  maxCapacity: 6000,
                  businessTarget: 5200,
                  currentProduction: 4500,
                  deferment: 1500,
                  unit: 'mcf/d',
                  trend: 'stable' as const,
                  changePercent: 0.2,
                },
                flaredGas: {
                  maxCapacity: 1200,
                  businessTarget: 1000,
                  currentProduction: 800,
                  deferment: 400,
                  unit: 'mcf/d',
                  trend: 'up' as const,
                  changePercent: 1.2,
                }
              }
            },
            {
              id: 'east-production-unit-02',
              name: 'Gbaran',
              status: 'online',
              equipmentCount: 8,
              activeEquipment: 7,
              lastUpdated: new Date().toISOString(),
              facilities: [
                {
                  id: 'flowstation-002',
                  type: 'flowstation',
                  networks: {
                    oil: {
                      maxCapacity: 50000,
                      businessTarget: 42000,
                      currentProduction: 38000,
                      deferment: 12000,
                      unit: 'bbl/d',
                      trend: 'down',
                      changePercent: -1.3,
                    },
                    flaredGas: {
                      maxCapacity: 1000,
                      businessTarget: 800,
                      currentProduction: 600,
                      deferment: 400,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.0,
                    },
                  },
                },
                {
                  id: 'compressor-002',
                  type: 'compressor-station',
                  networks: {
                    domesticGas: {
                      maxCapacity: 40000,
                      businessTarget: 36000,
                      currentProduction: 33000,
                      deferment: 7000,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -1.2,
                    },
                    exportGas: {
                      maxCapacity: 60000,
                      businessTarget: 52000,
                      currentProduction: 45000,
                      deferment: 15000,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.2,
                    },
                    flaredGas: {
                      maxCapacity: 900,
                      businessTarget: 700,
                      currentProduction: 500,
                      deferment: 400,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -0.1,
                    },
                  },
                },
                {
                  id: 'gasplant-002',
                  type: 'gas-plant',
                  networks: {
                    domesticGas: {
                      maxCapacity: 48000,
                      businessTarget: 44000,
                      currentProduction: 39000,
                      deferment: 9000,
                      unit: 'mcf/d',
                      trend: 'up',
                      changePercent: 0.6,
                    },
                    exportGas: {
                      maxCapacity: 75000,
                      businessTarget: 68000,
                      currentProduction: 60000,
                      deferment: 15000,
                      unit: 'mcf/d',
                      trend: 'up',
                      changePercent: 0.7,
                    },
                    flaredGas: {
                      maxCapacity: 1600,
                      businessTarget: 1100,
                      currentProduction: 950,
                      deferment: 650,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -0.2,
                    },
                  },
                },
              ],
              networks: {
                oil: {
                  maxCapacity: 50000,
                  businessTarget: 42000,
                  currentProduction: 38000,
                  deferment: 12000,
                  unit: 'bbl/d',
                  trend: 'down' as const,
                  changePercent: -1.3,
                },
                domesticGas: {
                  maxCapacity: 40000,
                  businessTarget: 36000,
                  currentProduction: 33000,
                  deferment: 7000,
                  unit: 'mcf/d',
                  trend: 'down' as const,
                  changePercent: -1.2,
                },
                exportGas: {
                  maxCapacity: 60000,
                  businessTarget: 52000,
                  currentProduction: 45000,
                  deferment: 15000,
                  unit: 'mcf/d',
                  trend: 'stable' as const,
                  changePercent: 0.2,
                },
                flaredGas: {
                  maxCapacity: 1400,
                  businessTarget: 1000,
                  currentProduction: 900,
                  deferment: 400,
                  unit: 'mcf/d',
                  trend: 'up' as const,
                  changePercent: 1.2,
                }
              }
            }
          ] : [],
          summary: {
            totalUnits: 12,
            activeUnits: 11,
            offlineUnits: 1,
          },
          constraints: {
            active: 2,
            critical: 0,
            warning: 2
          }
        },
        {
          id: 'west',
          name: 'West Asset',
          status: 'warning',
          performance: {
            currentProduction: 38000,
            capacity: 50000,
            businessTarget: 45000,
            deferment:12000,
            trend: 'decreasing',
            changePercent: -1.3
          },
          productionUnits: includeUnits ? [
            {
              id: 'west-production-unit-01',
              name: 'Forcados',
              equipmentCount: 6,
              activeEquipment: 6,
              lastUpdated: new Date().toISOString(),
              facilities: [
                {
                  id: 'flowstation-101',
                  type: 'flowstation',
                  networks: {
                    oil: {
                      maxCapacity: 60000,
                      businessTarget: 52000,
                      currentProduction: 42000,
                      deferment: 18000,
                      unit: 'bbl/d',
                      trend: 'down',
                      changePercent: -1.1,
                    },
                    flaredGas: {
                      maxCapacity: 900,
                      businessTarget: 700,
                      currentProduction: 650,
                      deferment: 250,
                      unit: 'mcf/d',
                      trend: 'up',
                      changePercent: 0.1,
                    },
                  },
                },
                {
                  id: 'compressor-101',
                  type: 'compressor-station',
                  networks: {
                    domesticGas: {
                      maxCapacity: 38000,
                      businessTarget: 34000,
                      currentProduction: 30000,
                      deferment: 8000,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -1.0,
                    },
                    exportGas: {
                      maxCapacity: 58000,
                      businessTarget: 52000,
                      currentProduction: 43000,
                      deferment: 15000,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.1,
                    },
                    flaredGas: {
                      maxCapacity: 700,
                      businessTarget: 500,
                      currentProduction: 450,
                      deferment: 250,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.0,
                    },
                  },
                },
                {
                  id: 'gasplant-101',
                  type: 'gas-plant',
                  networks: {
                    domesticGas: {
                      maxCapacity: 42000,
                      businessTarget: 36000,
                      currentProduction: 33000,
                      deferment: 7000,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -0.8,
                    },
                    exportGas: {
                      maxCapacity: 60000,
                      businessTarget: 52000,
                      currentProduction: 45000,
                      deferment: 15000,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.2,
                    },
                    flaredGas: {
                      maxCapacity: 1200,
                      businessTarget: 800,
                      currentProduction: 900,
                      deferment: 300,
                      unit: 'mcf/d',
                      trend: 'up',
                      changePercent: 0.4,
                    },
                  },
                },
                { id: 'terminal-101', type: 'terminal' }
              ],
              networks: {
                oil: {
                  maxCapacity: 50000,
                  businessTarget: 42000,
                  currentProduction: 38000,
                  deferment: 12000,
                  unit: 'bbl/d',
                  trend: 'down' as const,
                  changePercent: -1.3,
                },
                domesticGas: {
                  maxCapacity: 40000,
                  businessTarget: 36000,
                  currentProduction: 33000,
                  deferment: 7000,
                  unit: 'mcf/d',
                  trend: 'down' as const,
                  changePercent: -1.2,
                },
                exportGas: {
                  maxCapacity: 60000,
                  businessTarget: 52000,
                  currentProduction: 45000,
                  deferment: 15000,
                  unit: 'mcf/d',
                  trend: 'stable' as const,
                  changePercent: 0.2,
                },
                flaredGas: {
                  maxCapacity: 1300,
                  businessTarget: 1000,
                  currentProduction: 900,
                  deferment: 400,
                  unit: 'mcf/d',
                  trend: 'up' as const,
                  changePercent: 1.2,
                }
              }
            },
            {
              id: 'west-production-unit-02',
              name: 'Outumara',
              equipmentCount: 6,
              activeEquipment: 6,
              lastUpdated: new Date().toISOString(),
              facilities: [
                {
                  id: 'flowstation-201',
                  type: 'flowstation',
                  networks: {
                    oil: {
                      maxCapacity: 52000,
                      businessTarget: 45000,
                      currentProduction: 39000,
                      deferment: 13000,
                      unit: 'bbl/d',
                      trend: 'down',
                      changePercent: -1.0,
                    },
                    flaredGas: {
                      maxCapacity: 950,
                      businessTarget: 700,
                      currentProduction: 650,
                      deferment: 300,
                      unit: 'mcf/d',
                      trend: 'up',
                      changePercent: 0.2,
                    },
                  },
                },
                {
                  id: 'compressor-201',
                  type: 'compressor-station',
                  networks: {
                    domesticGas: {
                      maxCapacity: 35000,
                      businessTarget: 32000,
                      currentProduction: 30000,
                      deferment: 5000,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.0,
                    },
                    exportGas: {
                      maxCapacity: 52000,
                      businessTarget: 48000,
                      currentProduction: 43000,
                      deferment: 9000,
                      unit: 'mcf/d',
                      trend: 'up',
                      changePercent: 0.3,
                    },
                    flaredGas: {
                      maxCapacity: 800,
                      businessTarget: 600,
                      currentProduction: 500,
                      deferment: 300,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.0,
                    },
                  },
                },
                {
                  id: 'gasplant-201',
                  type: 'gas-plant',
                  networks: {
                    domesticGas: {
                      maxCapacity: 40000,
                      businessTarget: 36000,
                      currentProduction: 33000,
                      deferment: 7000,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -0.5,
                    },
                    exportGas: {
                      maxCapacity: 58000,
                      businessTarget: 54000,
                      currentProduction: 45000,
                      deferment: 13000,
                      unit: 'mcf/d',
                      trend: 'stable',
                      changePercent: 0.1,
                    },
                    flaredGas: {
                      maxCapacity: 1100,
                      businessTarget: 900,
                      currentProduction: 800,
                      deferment: 300,
                      unit: 'mcf/d',
                      trend: 'down',
                      changePercent: -0.1,
                    },
                  },
                },
              ],
              networks: {
                oil: {
                  maxCapacity: 50000,
                  businessTarget: 42000,
                  currentProduction: 38000,
                  deferment: 12000,
                  unit: 'bbl/d',
                  trend: 'down' as const,
                  changePercent: -1.3,
                },
                domesticGas: {
                  maxCapacity: 40000,
                  businessTarget: 36000,
                  currentProduction: 33000,
                  deferment: 7000,
                  unit: 'mcf/d',
                  trend: 'down' as const,
                  changePercent: -1.2,
                },
                exportGas: {
                  maxCapacity: 60000,
                  businessTarget: 52000,
                  currentProduction: 45000,
                  deferment: 15000,
                  unit: 'mcf/d',
                  trend: 'stable' as const,
                  changePercent: 0.2,
                },
                flaredGas: {
                  maxCapacity: 1300,
                  businessTarget: 1000,
                  currentProduction: 900,
                  deferment: 400,
                  unit: 'mcf/d',
                  trend: 'up' as const,
                  changePercent: 1.2,
                }
              }
            }
          ] : [],
          summary: {
            totalUnits: 10,
            activeUnits: 9,
            offlineUnits: 1,
          },
          constraints: {
            active: 3,
            critical: 1,
            warning: 2
          }
        }
      ],
      comparison: {
        productionDifference: 7000,
        trend: 'east_leading'
      },
      timestamp: new Date().toISOString()
    };

    const response = createSecureResponse(assetsResponse);
    console.log('🏭 Mock API: GET /api/assets');
    return HttpResponse.json(response);
  }),

  // GET /api/assets/{assetId} - Individual asset data
  http.get('/api/assets/:assetId', async ({ params }) => {
    await networkDelay();
    
    const assetId = params.assetId as string;

    // Find the asset data (reuse from assets response above)
    const assetData = assetId === 'east' ? {
      id: 'east',
      name: 'East Asset',
      status: 'normal',
      performance: {
        currentProduction: 45000,
        capacity: 55000,
        trend: 'stable',
        changePercent: 2.1
      },
      productionUnits: [],
      summary: {
        totalUnits: 12,
        activeUnits: 11,
        offlineUnits: 1,
      },
      constraints: {
        active: 2,
        critical: 0,
        warning: 2
      }
    } : {
      id: 'west',
      name: 'West Asset',
      status: 'warning',
      performance: {
        currentProduction: 38000,
        capacity: 50000,
        trend: 'decreasing',
        changePercent: -1.3
      },
      productionUnits: [],
      summary: {
        totalUnits: 10,
        activeUnits: 9,
        offlineUnits: 1,
      },
      constraints: {
        active: 3,
        critical: 1,
        warning: 2
      }
    };

    const response = createSecureResponse(assetData);
    console.log(`🏭 Mock API: GET /api/assets/${assetId}`);
    return HttpResponse.json(response);
  }),

  // GET /api/terminal/operations - Terminal operations data
  http.get('/api/terminal/operations', async () => {
    await networkDelay();

    const terminalOpsData = {
      inventory: {
        totalCapacity: 2500000,
        currentVolume: 1850000,
        tanks: [
          {
            id: 'tank-001',
            name: 'Storage Tank 001',
            capacity: 1000000,
            currentVolume: 750000,
            status: 'normal',
            lastUpdated: new Date().toISOString()
          }
        ]
      },
      endurance: {
        days: 12.5,
        criticalThreshold: 5,
        warningThreshold: 10,
        forecastDate: new Date(Date.now() + 12.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      cargoSchedule: [
        {
          vesselName: 'MT Explorer',
          scheduledDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
          cargoSize: 800000,
          status: 'scheduled'
        }
      ]
    };

    const response = createSecureResponse(terminalOpsData);
    console.log('⛽ Mock API: GET /api/terminal/operations');
    return HttpResponse.json(response);
  }),

  // GET /api/alerts - Role-based alerts
  http.get('/api/alerts', async () => {
    await networkDelay();

    const alertsData = {
      alerts: [
        {
          id: 'alert-001',
          title: 'High Pressure Warning',
          description: 'Wellhead pressure exceeding normal operating range',
          priority: 'high',
          status: 'active',
          nodeId: 'east-well-001',
          nodeName: 'East Well 001',
          affectedStreams: ['oil'],
          createdAt: new Date().toISOString(),
          requiresFieldResponse: true
        },
        {
          id: 'alert-002',
          title: 'Compressor Efficiency Drop',
          description: 'Gas compressor efficiency below 85% threshold',
          priority: 'medium',
          status: 'acknowledged',
          nodeId: 'west-compressor-01',
          nodeName: 'West Compressor 01',
          affectedStreams: ['export-gas'],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          requiresFieldResponse: false
        }
      ],
      summary: {
        total: 2,
        active: 1,
        acknowledged: 1,
        resolved: 0,
        criticalCount: 0,
        warningCount: 2
      }
    };

    const response = createSecureResponse(alertsData);
    console.log('🚨 Mock API: GET /api/alerts');
    return HttpResponse.json(response);
  }),

  

  // GET /api/terminal/:terminalId/operations - Terminal-specific operations data
  http.get('/api/terminal/:terminalId/operations', async ({ params }) => {
    console.log('🔥 MSW: /api/terminal/:terminalId/operations handler called!');
    await networkDelay();

    const { terminalId } = params;
    
    // Terminal-specific mock data
    const terminalData = {
      bonny: {
        terminal: {
          id: 'bonny',
          name: 'Bonny Terminal',
          assetId: 'east',
          location: { lat: 4.4780, lng: 7.1710 },
          status: 'operational',
        },
        kpis: {
          capacityMillionBbl: 7.5,
          grossStockMillionBbl: 5.2,
          readyCrudeKbpd: 150,
          productionRateKbpd: 45,
          enduranceDays: 12.5,
        },
        inventory: {
          current: 5200000,
          capacity: 7500000,
          tanks: [
            {
              id: 'bonny-tank-1',
              name: 'Tank 101',
              capacity: 2500000,
              currentLevel: 1800000,
              status: 'in-service',
            },
            {
              id: 'bonny-tank-2',
              name: 'Tank 102',
              capacity: 2500000,
              currentLevel: 2100000,
              status: 'in-service',
            },
            {
              id: 'bonny-tank-3',
              name: 'Tank 103',
              capacity: 2500000,
              currentLevel: 1300000,
              status: 'maintenance',
            },
          ],
        },
        loadingOperations: {
          currentRate: 45000,
          maxRate: 50000,
          berthsOccupied: 1,
          totalBerths: 2,
        },
        cargoSchedule: [
          {
            id: 'cargo-001',
            terminalId: 'bonny',
            vesselName: 'MT Atlantic Pioneer',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            cargoSize: 950000,
            status: 'scheduled',
            destination: 'Rotterdam',
            loadingBerth: 'Berth 1',
            eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'cargo-002',
            terminalId: 'bonny',
            vesselName: 'MT Pacific Voyager',
            scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            cargoSize: 1000000,
            status: 'scheduled',
            destination: 'Singapore',
          },
        ],
        performance: {
          monthlyThroughput: 4500000,
          demurrage: 24,
          loadingEfficiency: 92.5,
        },
      },
      forcados: {
        terminal: {
          id: 'forcados',
          name: 'Forcados Terminal',
          assetId: 'west',
          location: { lat: 5.3512, lng: 5.3725 },
          status: 'operational',
        },
        kpis: {
          capacityMillionBbl: 8.5,
          grossStockMillionBbl: 6.1,
          readyCrudeKbpd: 170,
          productionRateKbpd: 48,
          enduranceDays: 10.7,
        },
        inventory: {
          current: 6100000,
          capacity: 8500000,
          tanks: [
            {
              id: 'forcados-tank-1',
              name: 'Tank 201',
              capacity: 3000000,
              currentLevel: 2200000,
              status: 'in-service',
            },
            {
              id: 'forcados-tank-2',
              name: 'Tank 202',
              capacity: 3000000,
              currentLevel: 2500000,
              status: 'in-service',
            },
            {
              id: 'forcados-tank-3',
              name: 'Tank 203',
              capacity: 2500000,
              currentLevel: 1400000,
              status: 'in-service',
            },
          ],
        },
        loadingOperations: {
          currentRate: 48000,
          maxRate: 55000,
          berthsOccupied: 2,
          totalBerths: 2,
        },
        cargoSchedule: [
          {
            id: 'cargo-003',
            terminalId: 'forcados',
            vesselName: 'MT Nordic Freedom',
            scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            cargoSize: 900000,
            status: 'loading',
            destination: 'Houston',
            loadingBerth: 'Berth 1',
          },
          {
            id: 'cargo-004',
            terminalId: 'forcados',
            vesselName: 'MT Mediterranean Glory',
            scheduledDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            cargoSize: 950000,
            status: 'scheduled',
            destination: 'Qingdao',
          },
        ],
        performance: {
          monthlyThroughput: 5100000,
          demurrage: 18,
          loadingEfficiency: 94.2,
        },
      },
      'sea-eagle': {
        terminal: {
          id: 'sea-eagle',
          name: 'Sea Eagle Terminal',
          assetId: 'west',
          location: { lat: 4.1755, lng: 6.9535 },
          status: 'maintenance',
        },
        kpis: {
          capacityMillionBbl: 4.5,
          grossStockMillionBbl: 2.8,
          readyCrudeKbpd: 60,
          productionRateKbpd: 35,
          enduranceDays: 7.1,
        },
        inventory: {
          current: 2800000,
          capacity: 4500000,
          tanks: [
            {
              id: 'sea-eagle-tank-1',
              name: 'Tank 301',
              capacity: 1500000,
              currentLevel: 1100000,
              status: 'in-service',
            },
            {
              id: 'sea-eagle-tank-2',
              name: 'Tank 302',
              capacity: 1500000,
              currentLevel: 900000,
              status: 'in-service',
            },
            {
              id: 'sea-eagle-tank-3',
              name: 'Tank 303',
              capacity: 1500000,
              currentLevel: 800000,
              status: 'maintenance',
            },
          ],
        },
        loadingOperations: {
          currentRate: 0,
          maxRate: 40000,
          berthsOccupied: 0,
          totalBerths: 1,
        },
        cargoSchedule: [
          {
            id: 'cargo-005',
            terminalId: 'sea-eagle',
            vesselName: 'MT Asian Progress',
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            cargoSize: 700000,
            status: 'scheduled',
            destination: 'Ningbo',
          },
        ],
        performance: {
          monthlyThroughput: 2200000,
          demurrage: 36,
          loadingEfficiency: 82.4,
        },
      },
    };

    const response = createSecureResponse(terminalData[terminalId as keyof typeof terminalData]);
    console.log(`🏭 Mock API: GET /api/terminal/${terminalId}/operations`);
    return HttpResponse.json(response);
  }),

  // Add wells endpoints
  http.get('/api/facilities/:facilityId/wells', async ({ params, request }) => {
    await networkDelay();
    const { facilityId } = params as { facilityId: string };
    const url = new URL(request.url);
    const network = url.searchParams.get('network');

    const rows = [
      {
        wellId: `${facilityId}-well-001`,
        wellName: `${facilityId}-001`,
        status: 'Active',
        priority: 1,
        networks: ['oil'],
        potentialOilRateEC: 1200,
        mlPredictedOilRate: 1100,
        currentOilRate: 950,
        chokeSetting: 36,
        flowingTHP: 850,
        flowingTHT: 78,
        lastTestDate: new Date().toISOString().slice(0, 10),
        bsw: 0.6,
        gor: 1200,
      },
      {
        wellId: `${facilityId}-well-002`,
        wellName: `${facilityId}-002`,
        status: 'Active',
        priority: 2,
        networks: ['oil'],
        potentialOilRateEC: 1000,
        mlPredictedOilRate: 980,
        currentOilRate: 900,
        chokeSetting: 34,
        flowingTHP: 840,
        flowingTHT: 76,
        lastTestDate: new Date().toISOString().slice(0, 10),
        bsw: 0.5,
        gor: 1150,
      },
    ];

    const filtered = network ? rows.filter(r => r.networks?.includes(network as 'oil' | 'domesticGas' | 'exportGas')) : rows;
    return HttpResponse.json(createSecureResponse(filtered));
  }),

  http.get('/api/wells/:wellId', async ({ params }) => {
    await networkDelay();
    const { wellId } = params as { wellId: string };

    const detail = {
      identity: {
        wellId,
        wellName: wellId.toString().toUpperCase(),
        type: 'Oil' as const,
        status: 'Active' as const,
        priority: 1,
      },
      networks: ['oil'] as const,
      latest: {
        chokeSetting: 36,
        current: { oil: 950, gas: 1200000, water: 50 },
        potentialEC: { oil: 1200, gas: 1400000 },
        mlPredicted: { oil: 1100, gas: 1300000 },
        pressures: { flowingTHP: 850 },
        temperatures: { flowingTHT: 78 },
        quality: { oil: 'Good' as const },
      },
      lastTest: {
        date: new Date().toISOString().slice(0, 10),
        oilRate: 1180,
        gasRate: 1350000,
        waterRate: 60,
        BSW: 0.5,
        GOR: 1140,
      },
    };

    return HttpResponse.json(createSecureResponse(detail));
  }),

  http.get('/api/wells/:wellId/timeseries', async () => {
    await networkDelay();
    const now = Date.now();
    const points = Array.from({ length: 24 }).map((_, i) => ({
      timestamp: new Date(now - (23 - i) * 3600_000).toISOString(),
      oilRate: 900 + Math.round(Math.random() * 100),
      gasRate: 1_200_000 + Math.round(Math.random() * 50_000),
      chokeSetting: 34 + Math.round(Math.random() * 3),
      flowingTHP: 820 + Math.round(Math.random() * 40),
      flowingTHT: 75 + Math.round(Math.random() * 5),
    }));
    return HttpResponse.json(createSecureResponse(points));
  }),

];

// =============================================================================
// BROWSER SETUP
// =============================================================================

/**
 * MSW browser worker setup for development
 */
export async function setupMocks() {
  // Enable MSW in dev, or in preview if explicitly allowed
  const envObj = (import.meta as unknown as { env?: Record<string, string> })
  const allowPreview = envObj?.env?.VITE_PREVIEW_MSW === 'true'
  const isBrowser = typeof window !== 'undefined'
  if (!isBrowser) return;
  if (process.env.NODE_ENV !== 'development' && !allowPreview) return;
  
  // Dynamic import of worker to avoid bundling MSW into production builds
  const { setupWorker } = await import('msw/browser');
  
  // Create worker with our handlers
  const worker = setupWorker(...handlers);
  
  await worker.start({
    onUnhandledRequest: 'warn',
    serviceWorker: {
      url: '/mockServiceWorker.js'
    }
  });
  
  console.log('🎭 Mock Service Worker started with', handlers.length, 'handlers');
  console.log('📋 Handlers registered for endpoints: /api/nodes, /api/summary, /api/assets, etc.');
} 