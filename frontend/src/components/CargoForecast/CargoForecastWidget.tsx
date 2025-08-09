import React, { Suspense } from 'react';
import { Loader2, Ship, AlertTriangle } from 'lucide-react';
import { useCargoForecast } from '../../hooks/useCargoForecast';
import type { ApexOptions } from 'apexcharts';

interface CargoSchedule {
  vesselName: string;
  scheduledDate: string;
  cargoSize: number;
  status: 'scheduled' | 'loading' | 'completed';
  destination?: string;
  loadingPort?: string;
}

// Lazy load ApexCharts for better performance
const Chart = React.lazy(() => import('react-apexcharts'));

export const CargoForecastWidget: React.FC = () => {
  const { data: cargoData, isLoading, error } = useCargoForecast();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !cargoData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Unable to Load Cargo Forecast
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {error?.message || 'Failed to fetch cargo data'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartOptions: ApexOptions = {
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
        barHeight: '80%',
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
    },
    legend: {
      labels: {
        colors: '#64748b',
      },
    },
  };

  const chartData = [{
    name: 'Cargo Schedule',
    data: cargoData.map((cargo: CargoSchedule) => ({
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cargo Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Next {cargoData.length} scheduled shipments
          </p>
        </div>
        <Ship className="h-6 w-6 text-gray-400" />
      </div>

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

      <div className="mt-4 grid grid-cols-3 gap-4">
        {cargoData.slice(0, 3).map((cargo: CargoSchedule) => (
          <div key={cargo.vesselName} className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {cargo.vesselName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {new Date(cargo.scheduledDate).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {(cargo.cargoSize / 1000).toFixed(1)}k bbls
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 