/**
 * API Type Definitions
 * Following TRS Section 4 specifications with security-ready patterns
 * 
 * Security-ready features:
 * - SecureApiResponse wrapper for future auth integration
 * - Input validation support
 * - Comprehensive error handling types
 */

// =============================================================================
// SECURITY-READY API WRAPPER TYPES
// =============================================================================

/**
 * Secure API Response wrapper - ready for auth, signatures, metadata
 */
export interface SecureApiResponse<T> {
  data: T;
  timestamp: string;
  success: boolean;
  // Ready for future security additions:
  // signature?: string;
  // requestId?: string;
  // permissions?: string[];
}

/**
 * API Error response with security context
 */
export interface ApiError {
  message: string;
  code: string;
  timestamp: string;
  // Ready for security logging:
  // requestId?: string;
  // userId?: string;
}

/**
 * Stream types for gas processing operations
 */
export type StreamType = 'oil' | 'export-gas' | 'domestic-gas';

/**
 * Network classification for facilities and summaries
 * Includes flared gas alongside producible networks
 */
export type NetworkType = 'oil' | 'export-gas' | 'domestic-gas' | 'flared-gas';

/**
 * Constraint severity levels with color-coded indicators
 */
export type ConstraintLevel = 'normal' | 'warning' | 'critical' | 'offline';

// =============================================================================
// CORE BUSINESS INTERFACES (TRS Section 4)
// =============================================================================

/**
 * Node KPI Interface (GET /api/nodes)
 * Represents individual production nodes in the flow chain
 */
export interface NodeKpi {
  id: string;
  name: string;
  type: 'well' | 'flowline' | 'facility' | 'pipeline' | 'receiving-node';
  constraintLevel: ConstraintLevel;
  throughput: {
    current: number;
    capacity: number;
    unit: string;
    efficiency: number; // percentage
  };
  streams: {
    oil?: {
      rate: number;
      unit: string;
    };
    exportGas?: {
      rate: number;
      unit: string;
    };
    domesticGas?: {
      rate: number;
      unit: string;
    };
  };
  location: {
    lat?: number;
    lng?: number;
    region: string;
  };
  lastUpdated: string;
  // Ready for security:
  // permissions?: string[];
}

export interface NetworkMetrics {
  maxCapacity: number;
  /** Business planning target within the capacity envelope */
  businessTarget: number;
  currentProduction: number;
  deferment: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

/**
 * Networks rollup per asset, extended to include flared gas 
 */
export type AssetNetworks = Partial<Record<'oil' | 'domesticGas' | 'exportGas' | 'flaredGas', NetworkMetrics>>;

export interface Asset {
  currentProduction: number;
  capacity: number;
  status: 'normal' | 'warning' | 'critical';
  activeUnits: number;
  totalUnits: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  networks: AssetNetworks;
}

/**
 * Facility model representing Flowstations, Compressor Stations, and Gas Plants
 * Facilities may participate in multiple networks (e.g., export and domestic gas)
 */
export type FacilityType = 'flowstation' | 'compressor-station' | 'gas-plant' | 'terminal';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  assetId: string;
  hubId?: string;
  /** Networks this facility supports */
  networks: NetworkType[];
  /** Optional per-network metrics; units must match network domain (bbl/d for oil, mcf/d for gas) */
  metricsByNetwork?: Partial<Record<NetworkType, NetworkMetrics>>;
  status?: 'online' | 'offline' | 'maintenance' | 'startup';
  lastUpdated?: string;
}

export interface SummaryKpi {
  timestamp: string;
  systemHealth: {
    nodesOnline: number;
    totalNodes: number;
    criticalIssues: number;
    warningIssues: number;
  };
  assets: {
    east: Asset;
    west: Asset;
  };
  lastUpdated: string;
}

/**
 * Gap Driver Interface (GET /api/gap-drivers)
 * Identifies top contributors to production gaps
 */
export interface GapDriver {
  id: string;
  nodeId: string;
  nodeName: string;
  gapType: 'throughput' | 'efficiency' | 'maintenance' | 'constraint';
  description: string;
  impact: {
    lostProduction: number;
    unit: string;
    percentage: number;
  };
  affectedStreams: StreamType[];
  duration: {
    start: string;
    estimated_end?: string;
    totalHours: number;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'acknowledged';
  lastUpdated: string;
}

/**
 * Cargo Forecast Interface (GET /api/cargo-forecast)
 * Timeline forecast for cargo shipments
 */
export interface CargoForecastPoint {
  id: string;
  timestamp: string;
  forecastType: 'oil';
  volume: {
    amount: number;
    unit: string;
  };
  confidence: number; // percentage
  source: 'historical' | 'ai-prediction' | 'manual';
  metadata: {
    vessel?: string;
    destination?: string;
    loadingPort?: string;
  };
}

/**
 * Constraint Event Interface (GET /api/constraints?stream=...)
 * Real-time constraint events affecting production
 */
export interface ConstraintEvent {
  id: string;
  nodeId: string;
  nodeName: string;
  eventType: 'pressure' | 'temperature' | 'flow' | 'maintenance' | 'safety';
  severity: 'info' | 'warning' | 'critical';
  stream: StreamType;
  description: string;
  details: {
    currentValue?: number;
    threshold?: number;
    unit?: string;
    deviation?: number;
  };
  timestamp: string;
  estimatedResolution?: string;
  actionRequired: boolean;
  // Security-ready for audit trails:
  // reportedBy?: string;
  // acknowledgedBy?: string;
}

/**
 * Optimisation Action Interface (GET /api/optimisations?stream=...)
 * AI-generated optimization recommendations
 */
export interface OptimisationAction {
  id: string;
  stream: StreamType;
  type: 'pressure_adjust' | 'flow_redistribution' | 'maintenance_schedule' | 'capacity_upgrade';
  title: string;
  description: string;
  impact: {
    estimatedGain: number;
    unit: string;
    confidence: number; // percentage
    timeframe: string;
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    estimatedCost?: number;
    currency?: string;
    requiredSkills: string[];
    estimatedDuration: string;
  };
  affectedNodes: string[];
  status: 'pending' | 'acknowledged' | 'implementing' | 'completed' | 'rejected';
  priority: number; // 1-10 scale
  createdAt: string;
  validUntil: string;
  // Security-ready for approvals:
  // approvalRequired?: boolean;
  // approvedBy?: string;
  // implementedBy?: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Query parameters for constraints endpoint
 */
export interface ConstraintsQuery {
  stream?: StreamType;
  severity?: 'info' | 'warning' | 'critical';
  nodeId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for optimisations endpoint
 */
export interface OptimisationsQuery {
  stream?: StreamType;
  status?: 'pending' | 'acknowledged' | 'implementing' | 'completed' | 'rejected';
  priority?: 'low' | 'medium' | 'high';
  limit?: number;
  offset?: number;
}

/**
 * Mutation request for updating optimisation status
 */
export interface UpdateOptimisationRequest {
  status: 'acknowledged' | 'implementing' | 'completed' | 'rejected';
  notes?: string;
  // Security-ready:
  // signature?: string;
}

// =============================================================================
// WEBSOCKET EVENT TYPES
// =============================================================================

/**
 * WebSocket event types for real-time updates
 */
export type WebSocketEventType = 
  | 'optimisation_update'
  | 'constraint_alert'
  | 'kpi_update'
  | 'system_status';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  data: T;
  timestamp: string;
  // Security-ready:
  // signature?: string;
  // userId?: string;
}

// =============================================================================
// INPUT VALIDATION TYPES (Security-ready)
// =============================================================================

/**
 * Validation result for security-ready input checking
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: unknown;
} 

export type TerminalId = 'bonny' | 'forcados' | 'sea-eagle';

export interface Terminal {
  id: TerminalId;
  name: string;
  assetId: 'east' | 'west';
  location: {
    lat: number;
    lng: number;
  };
  status: 'operational' | 'maintenance' | 'shutdown';
}

/** Terminal KPIs tracked for summary and ops views */
export interface TerminalKpis {
  /** Maximum storage capacity in million barrels */
  capacityMillionBbl: number;
  /** Gross stock in million barrels */
  grossStockMillionBbl: number;
  /** Ready crude in thousand barrels per day */
  readyCrudeKbpd: number;
  /** Production rate in thousand barrels per day */
  productionRateKbpd: number;
  /** Inventory endurance in days */
  enduranceDays: number;
}

export interface CargoSchedule {
  id: string;
  terminalId: TerminalId;
  vesselName: string;
  scheduledDate: string;
  cargoSize: number;
  status: 'scheduled' | 'loading' | 'completed';
  destination: string;
  loadingBerth?: string;
  eta?: string;
  loadingRate?: number;
  qualitySpecs?: {
    api: number;
    sulphur: number;
    bsw: number;
  };
}

export interface TerminalOperations {
  terminal: Terminal;
  /** High-level KPIs for the terminal dashboard */
  kpis: TerminalKpis;
  inventory: {
    current: number;
    capacity: number;
    tanks: Array<{
      id: string;
      name: string;
      capacity: number;
      currentLevel: number;
      status: 'in-service' | 'maintenance' | 'offline';
    }>;
  };
  loadingOperations: {
    currentRate: number;
    maxRate: number;
    berthsOccupied: number;
    totalBerths: number;
  };
  cargoSchedule: CargoSchedule[];
  performance: {
    monthlyThroughput: number;
    demurrage: number;
    loadingEfficiency: number;
  };
}

// =============================================================================
// Well drill-down types
// =============================================================================

export interface WellListRow {
  wellId: string;
  wellName: string;
  status: 'Active' | 'Shut-In' | 'Maintenance' | 'Unknown';
  priority?: number;
  networks?: Array<'oil' | 'domesticGas' | 'exportGas'>;
  potentialOilRateEC?: number;
  potentialGasRateEC?: number;
  mlPredictedOilRate?: number;
  mlPredictedGasRate?: number;
  currentOilRate?: number;
  currentGasRate?: number;
  currentWaterRate?: number;
  chokeSetting?: number;
  flowingTHP?: number; // psi
  flowingTHT?: number; // °C
  lastTestDate?: string;
  bsw?: number; // %
  gor?: number; // scf/bbl
}

export interface WellDetail {
  identity: {
    wellId: string;
    wellName: string;
    type?: 'Oil' | 'Gas' | 'Water' | 'Unknown';
    status: 'Active' | 'Shut-In' | 'Maintenance' | 'Unknown';
    priority?: number;
  };
  networks?: Array<'oil' | 'domesticGas' | 'exportGas'>;
  latest: {
    chokeSetting?: number;
    current?: { oil?: number; gas?: number; water?: number };
    potentialEC?: { oil?: number; gas?: number };
    mlPredicted?: { oil?: number; gas?: number };
    pressures?: { flowingTHP?: number };
    temperatures?: { flowingTHT?: number };
    quality?: { oil?: 'Good' | 'Suspect' | 'Bad' };
  };
  lastTest?: {
    date?: string;
    oilRate?: number;
    gasRate?: number;
    waterRate?: number;
    BSW?: number;
    GOR?: number;
  };
}

export interface WellTimeseriesPoint {
  timestamp: string;
  oilRate?: number;
  gasRate?: number;
  waterRate?: number;
  chokeSetting?: number;
  flowingTHP?: number;
  flowingTHT?: number;
} 