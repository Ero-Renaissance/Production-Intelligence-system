import React from 'react';
import { TrendingUp, Droplet, Wind, Factory, Truck, ArrowDown, ArrowRight } from 'lucide-react';
import { useProductionFlow } from '../../hooks/useProductionFlow';

interface ProductionFlowMapProps {
  assetId?: 'east' | 'west';
}

const NodeCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  status: string;
  type: 'well' | 'flowstation' | 'gasplant' | 'terminal' | 'compressor' | 'manifold' | 'receiving';
}> = ({ title, value, unit, status, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'well':
        return <Droplet className="h-5 w-5" />;
      case 'flowstation':
        return <Factory className="h-5 w-5" />;
      case 'gasplant':
        return <Wind className="h-5 w-5" />;
      case 'terminal':
      case 'receiving':
        return <Truck className="h-5 w-5" />;
      case 'compressor':
        return <TrendingUp className="h-5 w-5" />;
      case 'manifold':
        return <Factory className="h-5 w-5 opacity-70" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-100 border-green-500 dark:bg-green-900/20';
      case 'reduced':
        return 'bg-yellow-100 border-yellow-500 dark:bg-yellow-900/20';
      case 'offline':
        return 'bg-red-100 border-red-500 dark:bg-red-900/20';
      default:
        return 'bg-gray-100 border-gray-500 dark:bg-gray-800';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          status === 'online' ? 'bg-green-500/20 text-green-700' :
          status === 'reduced' ? 'bg-yellow-500/20 text-yellow-700' :
          'bg-red-500/20 text-red-700'
        }`}>
          {status}
        </span>
      </div>
      <div className="text-xl font-bold">
        {value.toLocaleString()} {unit}
      </div>
    </div>
  );
};

const FlowArrow: React.FC<{
  direction: 'right' | 'down';
  label?: string;
}> = ({ direction, label }) => (
  <div className={`flex ${direction === 'down' ? 'flex-col' : ''} items-center justify-center p-2`}>
    <div className="text-gray-200 text-sm">{label}</div>
    {direction === 'down' ? (
      <ArrowDown className="h-6 w-6 text-gray-200" />
    ) : (
      <ArrowRight className="h-6 w-6 text-gray-200" />
    )}
  </div>
);

export const ProductionFlowMap: React.FC<ProductionFlowMapProps> = ({ assetId }) => {
  const { data: flowData, isLoading, error } = useProductionFlow(assetId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-700 rounded w-1/4"></div>
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !flowData) {
    return (
      <div className="text-center text-gray-200">
        Failed to load production flow data
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-200">
      <h2 className="text-xl font-semibold text-white">Production Flow Map</h2>
      
      {/* Wells Layer */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {flowData.wells.map(well => (
          <NodeCard
            key={well.id}
            title={well.name}
            value={well.oilRate}
            unit="bbl/d"
            status={well.status}
            type="well"
          />
        ))}
      </div>
      
      <FlowArrow direction="down" label="Flowlines" />

      {/* Manifolds Layer */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {flowData.manifolds.map(manifold => (
          <NodeCard
            key={manifold.id}
            title={manifold.name}
            value={flowData.flowlines.filter(f => manifold.connectedFlowlines.includes(f.id)).length}
            unit="connections"
            status={manifold.status}
            type="manifold"
          />
        ))}
      </div>

      <FlowArrow direction="down" label="Bulkline" />

      {/* Processing Facilities Layer */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Flow Stations</h3>
          <div className="space-y-4">
            {flowData.flowstations.map(fs => (
              <NodeCard
                key={fs.id}
                title={fs.name}
                value={fs.throughput}
                unit="bbl/d"
                status={fs.status}
                type="flowstation"
              />
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Compressor Stations</h3>
          <div className="space-y-4">
            {flowData.compressorStations.map(cs => (
              <NodeCard
                key={cs.id}
                title={cs.name}
                value={cs.throughput}
                unit="mscf/d"
                status={cs.status}
                type="compressor"
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-white mb-3">Gas Plants</h3>
          <div className="space-y-4">
            {flowData.gasPlants.map(gp => (
              <NodeCard
                key={gp.id}
                title={gp.name}
                value={gp.salesGas}
                unit="mscf/d"
                status={gp.status}
                type="gasplant"
              />
            ))}
          </div>
        </div>
      </div>

      <FlowArrow direction="down" label="Pipelines" />

      {/* End Points Layer */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Oil Terminals</h3>
          <div className="space-y-4">
            {flowData.terminals.map(term => (
              <NodeCard
                key={term.id}
                title={term.name}
                value={term.inventory}
                unit="bbls"
                status={term.status}
                type="terminal"
              />
            ))}
          </div>
        </div>
        
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-white mb-3">Gas Receiving Points</h3>
          <div className="grid grid-cols-2 gap-4">
            {flowData.receivingPoints.map(rp => (
              <NodeCard
                key={rp.id}
                title={rp.name}
                value={rp.contractedRate}
                unit="mscf/d"
                status={rp.status}
                type="receiving"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 