import React, { useEffect, useState, useRef } from 'react';
import { logsApi } from '../api/client';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ServerLogs() {
  const [tab, setTab] = useState('combined');
  const [lines, setLines] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const bottomRef = useRef(null);
  const intervalRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const fn = tab === 'errors' ? logsApi.errors : logsApi.server;
      const { data } = await fn(200);
      setLines(data.lines || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
    }
  };

  useEffect(() => { load(); }, [tab]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 5000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, tab]);

  const lineColor = (line) => {
    if (line.includes('[error]') || line.includes('ERROR')) return 'text-red-400';
    if (line.includes('[warn]') || line.includes('WARN')) return 'text-amber-400';
    if (line.includes('[info]') || line.includes('INFO')) return 'text-slate-300';
    if (line.includes('[http]')) return 'text-cyan-400';
    return 'text-slate-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Server Logs</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto-refresh (5s)
          </label>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-sm text-white rounded-lg">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {['combined','errors'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
            {t === 'combined' ? 'All Logs' : 'Errors Only'}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">Showing last 200 of {total.toLocaleString()} lines</p>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 h-[60vh] overflow-y-auto font-mono text-xs">
        {lines.length === 0 && !loading && <p className="text-slate-500">No log entries</p>}
        {lines.map((line, i) => (
          <div key={i} className={`leading-5 ${lineColor(line)}`}>{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
