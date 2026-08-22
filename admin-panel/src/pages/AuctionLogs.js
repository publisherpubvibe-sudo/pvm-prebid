import React, { useEffect, useState } from 'react';
import { logsApi } from '../api/client';
import { format } from 'date-fns';

const STATUS_COLORS = { bid: 'text-emerald-400', nobid: 'text-slate-400', timeout: 'text-amber-400', error: 'text-red-400' };

export default function AuctionLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ bidder: '', status: '', publisherId: '' });

  const load = (p = 1) => {
    setLoading(true);
    logsApi.auction({ ...filters, page: p, limit: 50 })
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); setPages(r.data.pages); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Auction Logs</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input placeholder="Bidder" value={filters.bidder} onChange={e => setFilters(f => ({...f, bidder: e.target.value}))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm w-40 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">All Status</option>
          {['bid','nobid','timeout','error'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Publisher ID" value={filters.publisherId} onChange={e => setFilters(f => ({...f, publisherId: e.target.value}))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm w-40 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <button onClick={() => load(1)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold">Filter</button>
      </div>

      <p className="text-xs text-slate-500">{total.toLocaleString()} total records</p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-center text-slate-400 py-10">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left text-xs uppercase">
                  {['Time','Request ID','Publisher','Bidder','Region','Status','CPM','Latency'].map(h => (
                    <th key={h} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id} className="border-b border-slate-700/40 hover:bg-slate-700/20 text-xs">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{format(new Date(l.timestamp), 'MM/dd HH:mm:ss')}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400 truncate max-w-24" title={l.requestId}>{l.requestId?.slice(0,8)}…</td>
                    <td className="px-4 py-2.5 text-slate-300">{l.publisherId}</td>
                    <td className="px-4 py-2.5 text-white font-medium">{l.bidder}</td>
                    <td className="px-4 py-2.5 uppercase text-slate-400">{l.region}</td>
                    <td className={`px-4 py-2.5 font-semibold uppercase ${STATUS_COLORS[l.status] || 'text-slate-400'}`}>{l.status}</td>
                    <td className="px-4 py-2.5 text-amber-400">{l.status === 'bid' ? `$${l.cpm?.toFixed(4)}` : '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{l.responseTimeMs ? `${l.responseTimeMs}ms` : '—'}</td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No logs found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-sm text-white rounded-lg">Prev</button>
          <span className="text-sm text-slate-400">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => load(page + 1)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-sm text-white rounded-lg">Next</button>
        </div>
      )}
    </div>
  );
}
