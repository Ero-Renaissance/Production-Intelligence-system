/**
 * FlowMap Component
 * TRS Section 5: Horizontal chain of NodeCards with live bottleneck overlay
 * 
 * Features:
 * - Asset grouping (East/West) with visual separation
 * - Production unit clustering within assets
 * - Live constraint visualization with color coding
 * - Drill-down navigation support
 * - Real-time data updates via React Query
 */

import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, AlertTriangle, Info } from 'lucide-react'
import { useNodes } from '../../hooks/useNodes'
import { useAssets } from '../../hooks/useAssets'
import { NodeCard } from './NodeCard.tsx'
import { NodeKpi } from '../../types/api'

interface FlowMapProps {
  /** Enable asset grouping view */
  showAssetGrouping?: boolean
  /** Enable drill-down navigation */
  enableDrillDown?: boolean
  /** Highlight constraints */
  showConstraints?: boolean
}

/**
 * Groups nodes by asset and production unit for hierarchical display
 */
const groupNodesByAsset = (nodes: NodeKpi[]) => {
  const grouped = {
    east: [] as NodeKpi[],
    west: [] as NodeKpi[],
    system: [] as NodeKpi[], // System-wide nodes like terminals
  }

  nodes.forEach(node => {
    if (node.id.includes('east-')) {
      grouped.east.push(node)
    } else if (node.id.includes('west-')) {
      grouped.west.push(node)
    } else {
      grouped.system.push(node)
    }
  })

  return grouped
}

/**
 * Orders nodes by process flow: Wells → Manifolds → Flow Stations → Pipelines → Terminals
 */
const orderNodesByFlow = (nodes: NodeKpi[]) => {
  const flowOrder = ['well', 'manifold', 'flowstation', 'pipeline', 'terminal', 'gasplant', 'compressor']
  
  return [...nodes].sort((a, b) => {
    const aOrder = flowOrder.findIndex(type => a.type.toLowerCase().includes(type))
    const bOrder = flowOrder.findIndex(type => b.type.toLowerCase().includes(type))
    
    if (aOrder === bOrder) {
      return a.name.localeCompare(b.name)
    }
    
    return aOrder - bOrder
  })
}

export const FlowMap: React.FC<FlowMapProps> = ({
  showAssetGrouping = true,
  enableDrillDown = true,
  showConstraints = true,
}) => {
  const [searchParams] = useSearchParams()
  const stream = searchParams.get('stream') || 'all'
  const asset = searchParams.get('asset') || 'all'

  // Fetch production nodes and asset data
  const { data: nodes = [], isLoading: nodesLoading, error: nodesError } = useNodes()
  const { data: assetsData, isLoading: assetsLoading } = useAssets({ 
    enabled: showAssetGrouping 
  })

  // Process and group nodes for display
  const processedNodes = useMemo(() => {
    if (!nodes.length) return { east: [], west: [], system: [] }

    // Filter by stream if specified
    const filteredNodes = stream === 'all' 
      ? nodes 
      : nodes.filter(node => {
          const streams = node.streams
          return (stream === 'oil' && streams.oil) ||
                 (stream === 'export-gas' && streams.exportGas) ||
                 (stream === 'domestic-gas' && streams.domesticGas)
        })

    // Filter by asset if specified
    const assetFilteredNodes = asset === 'all'
      ? filteredNodes
      : filteredNodes.filter(node => 
          asset === 'east' ? node.id.includes('east-') :
          asset === 'west' ? node.id.includes('west-') :
          true
        )

    const grouped = groupNodesByAsset(assetFilteredNodes)
    
    return {
      east: orderNodesByFlow(grouped.east),
      west: orderNodesByFlow(grouped.west),
      system: orderNodesByFlow(grouped.system),
    }
  }, [nodes, stream, asset])

  // Loading state
  if (nodesLoading || assetsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (nodesError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Unable to Load Flow Map
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {nodesError.message || 'Failed to fetch production node data'}
          </p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Production Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No production nodes found for the selected filters.
          </p>
        </div>
      </div>
    )
  }

  const renderAssetFlow = (assetNodes: NodeKpi[], assetName: string, assetId: 'east' | 'west') => {
    if (!assetNodes.length) return null

    const assetInfo = assetsData?.assets.find(a => a.id === assetId)
    const statusColor = assetInfo?.status === 'critical' ? 'border-red-500' :
                       assetInfo?.status === 'warning' ? 'border-amber-500' :
                       'border-green-500'

    return (
      <div key={assetId} className={`border-2 rounded-xl p-4 ${statusColor} bg-white dark:bg-gray-800`}>
        {/* Asset Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {assetName} Asset
            </h3>
            {assetInfo && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{assetInfo.summary.activeUnits}/{assetInfo.summary.totalUnits} Units</span>
              </div>
            )}
          </div>
          
          {showConstraints && assetInfo?.constraints?.active && assetInfo.constraints.active > 0 && (
            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {assetInfo.constraints.active} Constraints
              </span>
            </div>
          )}
        </div>

        {/* Production Flow */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {assetNodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <NodeCard
                node={node}
                enableDrillDown={enableDrillDown}
                showConstraints={showConstraints}
                className="flex-shrink-0"
              />
              
              {index < assetNodes.length - 1 && (
                <ArrowRight 
                  className="h-5 w-5 text-gray-400 flex-shrink-0" 
                  aria-label="Flow direction"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" role="region" aria-label="Production Flow Map">
      {/* Asset Flows */}
      {showAssetGrouping && (
        <>
          {renderAssetFlow(processedNodes.east, 'East', 'east')}
          {renderAssetFlow(processedNodes.west, 'West', 'west')}
        </>
      )}

      {/* System-wide Nodes (Terminals, etc.) */}
      {processedNodes.system.length > 0 && (
        <div className="border-2 border-blue-500 rounded-xl p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Infrastructure
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Shared facilities and terminals
            </span>
          </div>
          
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            {processedNodes.system.map((node, index) => (
              <React.Fragment key={node.id}>
                <NodeCard
                  node={node}
                  enableDrillDown={enableDrillDown}
                  showConstraints={showConstraints}
                  className="flex-shrink-0"
                />
                
                {index < processedNodes.system.length - 1 && (
                  <ArrowRight 
                    className="h-5 w-5 text-gray-400 flex-shrink-0" 
                    aria-label="Flow direction"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Non-grouped view for simple linear flow */}
      {!showAssetGrouping && (
        <div className="border-2 border-gray-300 rounded-xl p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            {orderNodesByFlow(nodes).map((node, index) => (
              <React.Fragment key={node.id}>
                <NodeCard
                  node={node}
                  enableDrillDown={enableDrillDown}
                  showConstraints={showConstraints}
                  className="flex-shrink-0"
                />
                
                {index < nodes.length - 1 && (
                  <ArrowRight 
                    className="h-5 w-5 text-gray-400 flex-shrink-0" 
                    aria-label="Flow direction"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 