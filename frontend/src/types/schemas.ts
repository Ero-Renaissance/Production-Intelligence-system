import { z } from 'zod';
// Keep StreamType in sync with src/types/api.d.ts
const StreamTypeSchema = z.enum(['oil', 'export-gas', 'domestic-gas']);

// Shared enums
export const TrendSchema = z.enum(['up', 'down', 'stable']);

// Default metrics used for flared gas to ensure presence across all levels
const DEFAULT_FLARED_GAS_METRICS = {
  maxCapacity: 0,
  businessTarget: 0,
  currentProduction: 0,
  deferment: 0,
  unit: 'mcf/d',
  trend: 'stable' as const,
  changePercent: 0,
};

// Network metrics schema (asset-level)
export const NetworkMetricsSchema = z.object({
  maxCapacity: z.number().nonnegative().optional().default(0),
  businessTarget: z.number().nonnegative().optional().default(0),
  currentProduction: z.number().nonnegative().optional().default(0),
  deferment: z.number().nonnegative().optional().default(0),
  unit: z.string().default('bbl/d'),
  trend: TrendSchema.default('stable'),
  changePercent: z.number().default(0),
});

export const AssetNetworksSchema = z
  .object({
    oil: NetworkMetricsSchema.optional(),
    domesticGas: NetworkMetricsSchema.optional(),
    exportGas: NetworkMetricsSchema.optional(),
    flaredGas: NetworkMetricsSchema.optional(),
  })
  .partial()
  .transform((networks) => {
    const existing = networks ?? {};
    const flared = existing.flaredGas ?? DEFAULT_FLARED_GAS_METRICS;
    return {
      ...existing,
      flaredGas: { ...DEFAULT_FLARED_GAS_METRICS, ...flared },
    };
  });

export const AssetSchema = z.object({
  currentProduction: z.number().nonnegative().default(0),
  capacity: z.number().nonnegative().default(0),
  status: z.enum(['normal', 'warning', 'critical']).default('normal'),
  activeUnits: z.number().nonnegative().default(0),
  totalUnits: z.number().nonnegative().default(0),
  trend: TrendSchema.default('stable'),
  changePercent: z.number().default(0),
  networks: AssetNetworksSchema.default({ flaredGas: DEFAULT_FLARED_GAS_METRICS }),
});

export const SummaryKpiSchema = z.object({
  systemHealth: z.object({
    nodesOnline: z.number().nonnegative().default(0),
    totalNodes: z.number().nonnegative().default(0),
    criticalIssues: z.number().nonnegative().default(0),
    warningIssues: z.number().nonnegative().default(0),
  }),
  assets: z.object({
    east: AssetSchema,
    west: AssetSchema,
  }),
  lastUpdated: z.string(),
});

// Terminal KPIs
export const TerminalKpisSchema = z.object({
  capacityMillionBbl: z.number().nonnegative().default(0),
  grossStockMillionBbl: z.number().nonnegative().default(0),
  readyCrudeKbpd: z.number().nonnegative().default(0),
  productionRateKbpd: z.number().nonnegative().default(0),
  enduranceDays: z.number().nonnegative().default(0),
});

export const TerminalSchema = z.object({
  id: z.enum(['bonny', 'forcados', 'sea-eagle']),
  name: z.string(),
  assetId: z.enum(['east', 'west']),
  location: z.object({ lat: z.number(), lng: z.number() }),
  status: z.enum(['operational', 'maintenance', 'shutdown']).default('operational'),
});

export const TerminalOperationsSchema = z.object({
  terminal: TerminalSchema,
  kpis: TerminalKpisSchema,
  inventory: z.object({
    current: z.number().nonnegative().default(0),
    capacity: z.number().nonnegative().default(0),
    tanks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      capacity: z.number().nonnegative(),
      currentLevel: z.number().nonnegative(),
      status: z.enum(['in-service', 'maintenance', 'offline']).default('in-service'),
    })).default([]),
  }),
  loadingOperations: z.object({
    currentRate: z.number().nonnegative().default(0),
    maxRate: z.number().nonnegative().default(0),
    berthsOccupied: z.number().nonnegative().default(0),
    totalBerths: z.number().nonnegative().default(0),
  }),
  cargoSchedule: z.array(z.object({
    id: z.string(),
    terminalId: z.enum(['bonny', 'forcados', 'sea-eagle']),
    vesselName: z.string(),
    scheduledDate: z.string(),
    cargoSize: z.number().nonnegative(),
    status: z.enum(['scheduled', 'loading', 'completed']),
    destination: z.string(),
    loadingBerth: z.string().optional(),
    eta: z.string().optional(),
    loadingRate: z.number().optional(),
    qualitySpecs: z.object({ api: z.number(), sulphur: z.number(), bsw: z.number() }).optional(),
  })).default([]),
  performance: z.object({
    monthlyThroughput: z.number().nonnegative().default(0),
    demurrage: z.number().nonnegative().default(0),
    loadingEfficiency: z.number().nonnegative().default(0),
  }),
});

export type SummaryKpiParsed = z.infer<typeof SummaryKpiSchema>;
export type TerminalOperationsParsed = z.infer<typeof TerminalOperationsSchema>;

// ============================ Assets Hierarchy ============================
export const FacilityTypeSchema = z.enum(['flowstation', 'compressor-station', 'gas-plant', 'terminal']);

export const FacilityNetworksSchema = z
  .object({
    oil: NetworkMetricsSchema.optional(),
    domesticGas: NetworkMetricsSchema.optional(),
    exportGas: NetworkMetricsSchema.optional(),
    flaredGas: NetworkMetricsSchema.optional(),
  })
  .partial()
  .default({ flaredGas: DEFAULT_FLARED_GAS_METRICS })
  .transform((networks) => {
    const existing = networks ?? {};
    const flared = existing.flaredGas ?? DEFAULT_FLARED_GAS_METRICS;
    return {
      ...existing,
      flaredGas: { ...DEFAULT_FLARED_GAS_METRICS, ...flared },
    };
  });

export const FacilityRefSchema = z.object({
  id: z.string(),
  type: FacilityTypeSchema,
  networks: FacilityNetworksSchema.default({ flaredGas: DEFAULT_FLARED_GAS_METRICS }),
});

export const UnitNetworksSchema = z
  .object({
    oil: NetworkMetricsSchema.optional(),
    domesticGas: NetworkMetricsSchema.optional(),
    exportGas: NetworkMetricsSchema.optional(),
    flaredGas: NetworkMetricsSchema.optional(),
  })
  .partial()
  .default({ flaredGas: DEFAULT_FLARED_GAS_METRICS })
  .transform((networks) => {
    const existing = networks ?? {};
    const flared = existing.flaredGas ?? DEFAULT_FLARED_GAS_METRICS;
    return {
      ...existing,
      flaredGas: { ...DEFAULT_FLARED_GAS_METRICS, ...flared },
    };
  });

export const ProductionUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['online', 'offline', 'maintenance', 'startup']).default('online'),
  equipmentCount: z.number().nonnegative().default(0),
  activeEquipment: z.number().nonnegative().default(0),
  lastUpdated: z.string(),
  facilities: z.array(FacilityRefSchema).default([]),
  networks: UnitNetworksSchema,
});

export const AssetPerformanceSchema = z.object({
  currentProduction: z.number().nonnegative().default(0),
  capacity: z.number().nonnegative().default(0),
  businessTarget: z.number().nonnegative().default(0),
  deferment: z.number().nonnegative().default(0),
  trend: z.enum(['increasing', 'stable', 'decreasing']).default('stable'),
  changePercent: z.number().default(0),
});

export const AssetSummarySchema = z.object({
  totalUnits: z.number().nonnegative().default(0),
  activeUnits: z.number().nonnegative().default(0),
  offlineUnits: z.number().nonnegative().default(0),
});

export const AssetConstraintsSchema = z.object({
  active: z.number().nonnegative().default(0),
  critical: z.number().nonnegative().default(0),
  warning: z.number().nonnegative().default(0),
});

export const AssetItemSchema = z.object({
  id: z.enum(['east', 'west']),
  name: z.string(),
  status: z.enum(['normal', 'warning', 'critical']).default('normal'),
  performance: AssetPerformanceSchema,
  productionUnits: z.array(ProductionUnitSchema).default([]),
  summary: AssetSummarySchema,
  constraints: AssetConstraintsSchema,
});

export const AssetsResponseSchema = z.object({
  assets: z.array(AssetItemSchema),
  comparison: z.object({
    productionDifference: z.number().default(0),
    trend: z.string().default(''),
  }),
  timestamp: z.string(),
});

export type AssetsResponseParsed = z.infer<typeof AssetsResponseSchema>;

// ============================ Production Flow ============================
export const TopologyUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  assetId: z.enum(['east', 'west']),
});

export const TopologyFacilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: FacilityTypeSchema,
  unitId: z.string(),
  status: z.string(),
  networks: FacilityNetworksSchema.default({ flaredGas: DEFAULT_FLARED_GAS_METRICS }),
});

export const TopologyEdgeSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  product: z.enum(['oil', 'gas']),
  maxCapacity: z.number().nonnegative(),
  currentThroughput: z.number().nonnegative(),
  status: z.string(),
});

export const ProductionFlowSchema = z.object({
  units: z.array(TopologyUnitSchema),
  facilities: z.array(TopologyFacilitySchema),
  edges: z.array(TopologyEdgeSchema),
});

export type ProductionFlowParsed = z.infer<typeof ProductionFlowSchema>;

// ============================ Gap Drivers & Hub Performance ============================
export const GapDriverSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  nodeName: z.string(),
  gapType: z.enum(['throughput', 'efficiency', 'maintenance', 'constraint']),
  description: z.string(),
  impact: z.object({
    lostProduction: z.number(),
    unit: z.string(),
    percentage: z.number(),
  }),
  affectedStreams: z.array(StreamTypeSchema).default([]),
  duration: z.object({
    start: z.string(),
    estimated_end: z.string().optional(),
    totalHours: z.number(),
  }),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['active', 'acknowledged', 'resolved']),
  lastUpdated: z.string(),
});

export type GapDriverParsed = z.infer<typeof GapDriverSchema>;

export const HubTimeseriesPointSchema = z.object({
  timestamp: z.string(),
  capacity: z.number().nonnegative().default(0),
  target: z.number().nonnegative().default(0),
  actual: z.number().nonnegative().default(0),
  deferment: z.number().nonnegative().default(0),
});

export const HubPerformanceSchema = z.object({
  networks: UnitNetworksSchema,
  timeseries: z
    .object({
      oil: z.array(HubTimeseriesPointSchema).optional(),
      domesticGas: z.array(HubTimeseriesPointSchema).optional(),
      exportGas: z.array(HubTimeseriesPointSchema).optional(),
      flaredGas: z.array(HubTimeseriesPointSchema).optional(),
    })
    .partial()
    .default({}),
  events: z
    .array(
      z.object({
        id: z.string(),
        start: z.string(),
        end: z.string().optional(),
        type: z.string().default('event'),
        severity: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
        affectedStreams: z.array(z.string()).default([]),
        description: z.string().default(''),
      }),
    )
    .default([]),
});

export type HubPerformanceParsed = z.infer<typeof HubPerformanceSchema>;

// ============================ Wells ============================
export const WellListRowSchema = z.object({
  wellId: z.string(),
  wellName: z.string(),
  status: z.enum(['Active', 'Shut-In', 'Maintenance', 'Unknown']).default('Unknown'),
  priority: z.number().int().optional(),
  networks: z.array(z.enum(['oil', 'domesticGas', 'exportGas'])).optional(),
  potentialOilRateEC: z.number().optional(),
  potentialGasRateEC: z.number().optional(),
  mlPredictedOilRate: z.number().optional(),
  mlPredictedGasRate: z.number().optional(),
  currentOilRate: z.number().optional(),
  currentGasRate: z.number().optional(),
  currentWaterRate: z.number().optional(),
  chokeSetting: z.number().optional(),
  flowingTHP: z.number().optional(),
  flowingTHT: z.number().optional(),
  lastTestDate: z.string().optional(),
  bsw: z.number().optional(),
  gor: z.number().optional(),
});

export const WellDetailSchema = z.object({
  identity: z.object({
    wellId: z.string(),
    wellName: z.string(),
    type: z.enum(['Oil', 'Gas', 'Water', 'Unknown']).optional(),
    status: z.enum(['Active', 'Shut-In', 'Maintenance', 'Unknown']).default('Unknown'),
    priority: z.number().int().optional(),
  }),
  networks: z.array(z.enum(['oil', 'domesticGas', 'exportGas'])).optional(),
  latest: z.object({
    chokeSetting: z.number().optional(),
    current: z.object({ oil: z.number().optional(), gas: z.number().optional(), water: z.number().optional() }).partial().default({}),
    potentialEC: z.object({ oil: z.number().optional(), gas: z.number().optional() }).partial().default({}),
    mlPredicted: z.object({ oil: z.number().optional(), gas: z.number().optional() }).partial().default({}),
    pressures: z.object({ flowingTHP: z.number().optional() }).partial().default({}),
    temperatures: z.object({ flowingTHT: z.number().optional() }).partial().default({}),
    quality: z.object({ oil: z.enum(['Good', 'Suspect', 'Bad']).optional() }).partial().default({}),
  }),
  lastTest: z
    .object({
      date: z.string().optional(),
      oilRate: z.number().optional(),
      gasRate: z.number().optional(),
      waterRate: z.number().optional(),
      BSW: z.number().optional(),
      GOR: z.number().optional(),
    })
    .partial()
    .optional(),
});

export const WellTimeseriesPointSchema = z.object({
  timestamp: z.string(),
  oilRate: z.number().optional(),
  gasRate: z.number().optional(),
  waterRate: z.number().optional(),
  chokeSetting: z.number().optional(),
  flowingTHP: z.number().optional(),
  flowingTHT: z.number().optional(),
});

export type WellListRowParsed = z.infer<typeof WellListRowSchema>;
export type WellDetailParsed = z.infer<typeof WellDetailSchema>;
export type WellTimeseriesPointParsed = z.infer<typeof WellTimeseriesPointSchema>;
