import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFacilityWells } from '../../hooks/useWells';
import type { WellListRow } from '../../types/api';
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface Props {
  facilityId: string;
  network?: 'oil' | 'domesticGas' | 'exportGas';
}

const headerClass = 'px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider';
const cellClass = 'px-3 py-2 text-sm text-gray-900 dark:text-gray-100';
const PAGE_SIZE = 10;

export const WellsTable: React.FC<Props> = ({ facilityId, network }) => {
  const { data, isLoading, error } = useFacilityWells(facilityId, { network });
  const [sortKey, setSortKey] = useState<keyof WellListRow>('potentialOilRateEC');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  const rows = useMemo(() => {
    const list = data ?? [];
    const sorted = [...list].sort((a: WellListRow, b: WellListRow) => {
      const av = a[sortKey] as unknown;
      const bv = b[sortKey] as unknown;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    const ordered = sortDir === 'asc' ? sorted : sorted.reverse();
    return ordered;
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  const onSort = (key: keyof WellListRow) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const setSortByPotential = () => onSort('potentialOilRateEC');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading wells...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10 text-red-600">
        <AlertTriangle className="h-5 w-5 mr-2" /> Unable to load wells
      </div>
    );
  }

  if (!rows.length) {
    return <div className="py-6 text-sm text-gray-500 dark:text-gray-400">No wells found for this facility.</div>;
  }

  return (
    <div className="overflow-x-auto">
      {/* Table toolbar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {rows.length} wells • Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={setSortByPotential}
            className="inline-flex items-center gap-1 rounded border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort by Potential (EC)
          </button>
          <div className="ml-2 inline-flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center rounded-l border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center rounded-r border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className={headerClass} onClick={() => onSort('wellName')}>Well</th>
            <th className={headerClass} onClick={() => onSort('status')}>Status</th>
            <th className={headerClass} onClick={() => onSort('priority')}>Priority</th>
            <th className={headerClass} onClick={() => onSort('potentialOilRateEC')}>Potential (EC)</th>
            <th className={headerClass} onClick={() => onSort('mlPredictedOilRate')}>ML Rate</th>
            <th className={headerClass} onClick={() => onSort('currentOilRate')}>Current</th>
            <th className={headerClass} onClick={() => onSort('chokeSetting')}>Choke</th>
            <th className={headerClass} onClick={() => onSort('bsw')}>BS&W (%)</th>
            <th className={headerClass} onClick={() => onSort('gor')}>GOR (scf/bbl)</th>
            <th className={headerClass}>Last Test</th>
            <th className={headerClass}>Action</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {pagedRows.map((w) => (
            <tr key={w.wellId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className={cellClass}>{w.wellName}</td>
              <td className={cellClass}>{w.status}</td>
              <td className={cellClass}>{w.priority ?? '—'}</td>
              <td className={cellClass}>{w.potentialOilRateEC ?? '—'}</td>
              <td className={cellClass}>{w.mlPredictedOilRate ?? '—'}</td>
              <td className={cellClass}>{w.currentOilRate ?? '—'}</td>
              <td className={cellClass}>{w.chokeSetting ?? '—'}</td>
              <td className={cellClass}>{w.bsw ?? '—'}</td>
              <td className={cellClass}>{w.gor ?? '—'}</td>
              <td className={cellClass}>{w.lastTestDate ?? '—'}</td>
              <td className={cellClass}>
                <Link
                  className="inline-flex text-blue-600 hover:underline"
                  to={`/well/${encodeURIComponent(w.wellId)}`}
                >
                  View Well
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-600 dark:text-gray-300">
        <span>
          Showing {Math.min(rows.length, startIndex + 1)}–{Math.min(rows.length, startIndex + pagedRows.length)} of {rows.length}
        </span>
      </div>
    </div>
  );
}; 