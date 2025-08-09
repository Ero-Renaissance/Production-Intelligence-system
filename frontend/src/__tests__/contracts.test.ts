import { describe, it, expect } from '@jest/globals'
import { AssetsResponseSchema, SummaryKpiSchema, TerminalOperationsSchema, ProductionFlowSchema, GapDriverSchema } from '../types/schemas'

describe('API contract schemas', () => {
  it('parses /api/assets payload', () => {
    const payload = {
      assets: [
        {
          id: 'east',
          name: 'East Asset',
          status: 'normal',
          performance: { currentProduction: 1, capacity: 2, businessTarget: 1, deferment: 1, trend: 'stable', changePercent: 0 },
          productionUnits: [],
          summary: { totalUnits: 1, activeUnits: 1, offlineUnits: 0 },
          constraints: { active: 0, critical: 0, warning: 0 },
        },
        {
          id: 'west',
          name: 'West Asset',
          status: 'warning',
          performance: { currentProduction: 1, capacity: 2, businessTarget: 1, deferment: 1, trend: 'increasing', changePercent: 0 },
          productionUnits: [],
          summary: { totalUnits: 1, activeUnits: 1, offlineUnits: 0 },
          constraints: { active: 0, critical: 0, warning: 0 },
        },
      ],
      comparison: { productionDifference: 0, trend: '' },
      timestamp: new Date().toISOString(),
    }
    const parsed = AssetsResponseSchema.parse(payload)
    expect(parsed.assets.length).toBe(2)
  })

  it('parses /api/summary payload', () => {
    const payload = {
      systemHealth: { nodesOnline: 1, totalNodes: 1, criticalIssues: 0, warningIssues: 0 },
      assets: {
        east: { currentProduction: 1, capacity: 1, status: 'normal', activeUnits: 1, totalUnits: 1, trend: 'stable', changePercent: 0, networks: {} },
        west: { currentProduction: 1, capacity: 1, status: 'warning', activeUnits: 1, totalUnits: 1, trend: 'stable', changePercent: 0, networks: {} },
      },
      lastUpdated: new Date().toISOString(),
    }
    const parsed = SummaryKpiSchema.parse(payload)
    expect(parsed.assets.east).toBeTruthy()
  })

  it('parses /api/terminal/:id/operations payload', () => {
    const payload = {
      terminal: { id: 'bonny', name: 'Bonny', assetId: 'east', location: { lat: 0, lng: 0 }, status: 'operational' },
      kpis: { capacityMillionBbl: 0, grossStockMillionBbl: 0, readyCrudeKbpd: 0, productionRateKbpd: 0, enduranceDays: 0 },
      inventory: { current: 0, capacity: 0, tanks: [] },
      loadingOperations: { currentRate: 0, maxRate: 0, berthsOccupied: 0, totalBerths: 0 },
      cargoSchedule: [],
      performance: { monthlyThroughput: 0, demurrage: 0, loadingEfficiency: 0 },
    }
    const parsed = TerminalOperationsSchema.parse(payload)
    expect(parsed.terminal.id).toBe('bonny')
  })

  it('parses /api/production-flow payload', () => {
    const payload = {
      units: [{ id: 'u1', name: 'Unit 1', assetId: 'east' }],
      facilities: [{ id: 'f1', name: 'Fac 1', type: 'flowstation', unitId: 'u1', status: 'online', networks: {} }],
      edges: [{ sourceId: 'f1', targetId: 'f1', product: 'oil', maxCapacity: 1, currentThroughput: 1, status: 'ok' }],
    }
    const parsed = ProductionFlowSchema.parse(payload)
    expect(parsed.units.length).toBe(1)
  })

  it('parses /api/gap-drivers payload item', () => {
    const payload = {
      id: 'id',
      nodeId: 'node',
      nodeName: 'Node',
      gapType: 'constraint',
      description: 'desc',
      impact: { lostProduction: 1, unit: 'bbl/d', percentage: 1 },
      affectedStreams: ['oil'],
      duration: { start: new Date().toISOString(), totalHours: 1 },
      priority: 'low',
      status: 'active',
      lastUpdated: new Date().toISOString(),
    }
    const parsed = GapDriverSchema.parse(payload)
    expect(parsed.nodeId).toBe('node')
  })
}) 