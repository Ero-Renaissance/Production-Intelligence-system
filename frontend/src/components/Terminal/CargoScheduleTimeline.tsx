import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { CargoSchedule } from '../../types/api';

// Lazy load ApexCharts for better performance
const Chart = React.lazy(() => import('react-apexcharts'));

interface CargoScheduleTimelineProps {
  cargoes: CargoSchedule[];
}

interface TooltipParams {
  seriesIndex: number;
  dataPointIndex: number;
  w: {
    config: {
      series: Array<{
        data: Array<{
          x: string;
          y: [number, number];
          fillColor: string;
          cargoSize: number;
          status: string;
        }>;
      }>;
    };
  };
}

export const CargoScheduleTimeline: React.FC<CargoScheduleTimelineProps> = ({ cargoes }) => {
  const chartOptions = {
    chart: {
      type: 'rangeBar',
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        rangeBarGroupRows: true,
      },
    },
    colors: ['#0ea5e9', '#22c55e', '#eab308'],
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#64748b',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
        },
      },
    },
    grid: {
      borderColor: '#334155',
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'MMM dd, yyyy',
      },
      custom: function({ dataPointIndex }: TooltipParams) {
        const cargo = cargoes[dataPointIndex];
        return `
          <div class="px-3 py-2">
            <div class="font-medium">${cargo.vesselName}</div>
            <div class="text-sm opacity-80">${cargo.cargoSize.toLocaleString()} bbls</div>
            <div class="text-sm opacity-80">Status: ${cargo.status}</div>
            ${cargo.loadingBerth ? `<div class="text-sm opacity-80">Berth: ${cargo.loadingBerth}</div>` : ''}
            ${cargo.destination ? `<div class="text-sm opacity-80">To: ${cargo.destination}</div>` : ''}
          </div>
        `;
      },
    },
    legend: {
      labels: {
        colors: '#64748b',
      },
    },
  };

  const chartData = [{
    name: 'Cargo Schedule',
    data: cargoes.map(cargo => ({
      x: cargo.vesselName,
      y: [
        new Date(cargo.scheduledDate).getTime() - (24 * 60 * 60 * 1000), // 1 day before
        new Date(cargo.scheduledDate).getTime() + (24 * 60 * 60 * 1000), // 1 day after
      ],
      fillColor: cargo.status === 'scheduled' ? '#0ea5e9' : 
                 cargo.status === 'loading' ? '#22c55e' : '#eab308',
      cargoSize: cargo.cargoSize,
      status: cargo.status,
    })),
  }];

  return (
    <div>
      <div className="h-[300px]">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        }>
          <Chart
            options={chartOptions}
            series={chartData}
            type="rangeBar"
            height="100%"
          />
        </Suspense>
      </div>

      {/* Cargo List */}
      <div className="mt-6 space-y-4">
        {cargoes.map(cargo => (
          <div 
            key={cargo.id}
            className={`p-4 rounded-lg border ${
              cargo.status === 'scheduled' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
              cargo.status === 'loading' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
              'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {cargo.vesselName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(cargo.scheduledDate).toLocaleDateString()} • {cargo.cargoSize.toLocaleString()} bbls
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  cargo.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  cargo.status === 'loading' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {cargo.status.toUpperCase()}
                </span>
                {cargo.destination && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    To: {cargo.destination}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 