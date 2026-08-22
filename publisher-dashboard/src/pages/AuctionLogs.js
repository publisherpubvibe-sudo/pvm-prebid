import React, { useEffect, useState } from 'react';
import { logsApi } from '../api/client';
import { format } from 'date-fns';

const STATUS_COLORS = {
  bid:     'bg-emerald-900/50 text-emerald-400',
  nobid:   'bg-slate-700 text-slate-400',
  timeout: 'bg-amber-900/50 text-amber-400',
  error:   'bg-red-900/50 text-red-400',
};

export default function AuctionLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = (p = 1) => {
    setLoading(true);
    logsApi.auction({ status: statusFilter || undefined, page: p, limit: 50 })
      .then(r => {
        setLogs(r.data.logs);
        setTotal(r.data.total);
        setPages(r.data.pages);
        setPage(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [statusFilter]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Auction Logs</h1>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['', 'bid', 'nobid', 'timeout', 'error'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">{total.toLocaleString()} records</p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-center text-slate-400 py-10">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left text-xs uppercase">
                  {['Time', 'Ad Unit', 'Bidder', 'Region', 'Status', 'CPM', 'Latency'].map(h => (
                    <th key={h} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id} className="border-b border-slate-700/40 hover:bg-slate-700/20 text-xs">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                      {format(new Date(l.timestamp), 'MMM dd HH:mm:ss')}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{l.adUnitCode || '—'}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{l.bidder || '—'}</td>
                    <td className="px-4 py-2.5 uppercase text-slate-400">{l.region || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${STATUS_COLORS[l.status] || 'text-slate-400'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-amber-400">
                      {l.status === 'bid' ? `$${l.cpm?.toFixed(4)}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {l.responseTimeMs ? `${l.responseTimeMs}ms` : '—'}
                    </td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => load(page - 1)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-sm text-white rounded-lg">Prev</button>
          <span className="text-sm text-slate-400">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => load(page + 1)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-sm text-white rounded-lg">Next</button>
        </div>
      )}
    </div>
  );
}
