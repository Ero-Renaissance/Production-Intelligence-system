import React, { Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Gauge, Droplet, Thermometer, Activity, Loader2 } from 'lucide-react';
import { useWellDetail, useWellTimeseries } from '../hooks/useWells';
import type { ApexOptions } from 'apexcharts';

const Chart = React.lazy(() => import('react-apexcharts'));

type WindowSel = '24h' | '7d' | '30d' | '6m' | '12m';

export const WellDetail: React.FC = () => {
  const { wellId } = useParams<{ wellId: string }>();
  const navigate = useNavigate();
  const { data } = useWellDetail(wellId);

  const [windowSel, setWindowSel] = React.useState<WindowSel>('24h');
  const now = Date.now();
  const startMs = windowSel === '24h'
    ? now - 24 * 3600_000
    : windowSel === '7d'
      ? now - 7 * 24 * 3600_000
      : windowSel === '30d'
        ? now - 30 * 24 * 3600_000
        : windowSel === '6m'
          ? now - 182 * 24 * 3600_000
          : now - 365 * 24 * 3600_000; // 12m
  const start = new Date(startMs).toISOString();
  const end = new Date(now).toISOString();
  const interval = windowSel === '24h' ? '1h' : '1d';

  const { data: series } = useWellTimeseries(
    wellId,
    { start, end, interval },
    { enabled: windowSel === '24h' || windowSel === '7d' || windowSel === '30d', refetchInterval: 30000 }
  );

  // Generate dummy multi-month daily data (oil and choke correlated)
  const dummyMultiMonth = React.useMemo(() => {
    if (!(windowSel === '6m' || windowSel === '12m')) return undefined;
    const days = windowSel === '6m' ? 182 : 365;
    const points: Array<{ timestamp: string; oilRate: number; chokeSetting: number }> = [];
    const baseOil = data?.latest.current?.oil ?? 900;
    for (let i = days - 1; i >= 0; i--) {
      const t = new Date(now - i * 24 * 3600_000).toISOString();
      const seasonal = 50 * Math.sin((2 * Math.PI * (days - i)) / 180);
      const noise = (Math.random() - 0.5) * 40;
      const oil = Math.max(100, baseOil + seasonal + noise);
      const choke = Math.max(10, Math.min(64, Math.round(oil * 0.03 + (Math.random() - 0.5) * 3)));
      points.push({ timestamp: t, oilRate: Math.round(oil), chokeSetting: choke });
    }
    return points;
  }, [windowSel, now, data?.latest.current?.oil]);

  const options: ApexOptions = {
    chart: { type: 'line', toolbar: { show: false }, background: 'transparent' },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { type: 'datetime', labels: { style: { colors: '#64748b' } } },
    yaxis: [
      { labels: { style: { colors: '#64748b' } }, title: { text: 'Oil (bbl/d)' } },
      { labels: { style: { colors: '#64748b' } }, title: { text: 'Choke (size)' }, opposite: true },
    ],
    grid: { borderColor: '#334155', xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
    legend: { labels: { colors: '#64748b' } },
    tooltip: { theme: 'dark' },
    colors: ['#0ea5e9', '#eab308'],
  };

  const chartSeries = (windowSel === '6m' || windowSel === '12m')
    ? [
        {
          name: 'Oil Rate',
          data: (dummyMultiMonth ?? []).map(p => [new Date(p.timestamp).getTime(), p.oilRate])
        },
        {
          name: 'Choke',
          data: (dummyMultiMonth ?? []).map(p => [new Date(p.timestamp).getTime(), p.chokeSetting])
        },
      ]
    : [
        {
          name: 'Oil Rate',
          data: (series ?? []).map(p => [new Date(p.timestamp).getTime(), p.oilRate ?? null])
        },
        {
          name: 'Choke',
          data: (series ?? []).map(p => [new Date(p.timestamp).getTime(), p.chokeSetting ?? null])
        },
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <nav aria-label="Breadcrumb" className="text-sm text-gray-600 dark:text-gray-300">
              <ol className="flex items-center gap-2">
                <li>
                  <Link to="/" className="hover:underline">Home</Link>
                </li>
                <li className="opacity-60">/</li>
                <li aria-current="page" className="font-medium text-gray-900 dark:text-white">Well: {wellId}</li>
              </ol>
            </nav>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Well Detail</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400"><Droplet className="h-4 w-4" /><span className="text-sm font-semibold">Current Oil</span></div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{data?.latest.current?.oil ?? '—'} bbl/d</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400"><Gauge className="h-4 w-4" /><span className="text-sm font-semibold">Potential (EC)</span></div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{data?.latest.potentialEC?.oil ?? '—'} bbl/d</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400"><Activity className="h-4 w-4" /><span className="text-sm font-semibold">ML Rate</span></div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{data?.latest.mlPredicted?.oil ?? '—'} bbl/d</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400"><Thermometer className="h-4 w-4" /><span className="text-sm font-semibold">Choke</span></div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{data?.latest.chokeSetting ?? '—'}</div>
        </div>
      </div>

      {/* Last test and operating */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operating Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">FTHP</span>
            <span className="font-semibold text-gray-900 dark:text-white">{data?.latest.pressures?.flowingTHP ?? '—'} psi</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">FTT</span>
            <span className="font-semibold text-gray-900 dark:text-white">{data?.latest.temperatures?.flowingTHT ?? '—'} °C</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Last Test</span>
            <span className="font-semibold text-gray-900 dark:text-white">{data?.lastTest?.date ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trend</h2>
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setWindowSel('24h')} className={`px-3 py-1 rounded border ${windowSel==='24h'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>24h</button>
            <button onClick={() => setWindowSel('7d')} className={`px-3 py-1 rounded border ${windowSel==='7d'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>7d</button>
            <button onClick={() => setWindowSel('30d')} className={`px-3 py-1 rounded border ${windowSel==='30d'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>30d</button>
            <button onClick={() => setWindowSel('6m')} className={`px-3 py-1 rounded border ${windowSel==='6m'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>6m</button>
            <button onClick={() => setWindowSel('12m')} className={`px-3 py-1 rounded border ${windowSel==='12m'? 'bg-blue-600 text-white border-blue-600':'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>12m</button>
          </div>
        </div>
        <div className="h-64">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 text-gray-400 animate-spin" /></div>}>
            <Chart options={options} series={chartSeries} type="line" height="100%" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}; 