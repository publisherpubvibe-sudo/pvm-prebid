import React, { useEffect, useState } from 'react';
import { statsApi } from '../api/client';
import { useAuth } from '../App';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Legend,
} from 'recharts';

function KPICard({ label, value, sub, accent = 'teal' }) {
  const map = {
    teal:   'from-teal-500 to-cyan-600',
    violet: 'from-violet-500 to-indigo-600',
    amber:  'from-amber-500 to-orange-500',
    emerald:'from-emerald-500 to-teal-600',
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 bg-gradient-to-r ${map[accent]} bg-clip-text text-transparent`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Overview() {
  const { publisher } = useAuth();
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [range, setRange] = useState(24);
  const [loading, setLoading] = useState(true);

  const load = (h) => {
    setLoading(true);
    Promise.all([statsApi.overview(), statsApi.timeseries(h)])
      .then(([ov, ts]) => {
        setOverview(ov.data);
        setTimeseries(
          ts.data.map(d => ({
            label: `${String(d._id.month).padStart(2,'0')}/${String(d._id.day).padStart(2,'0')} ${String(d._id.hour).padStart(2,'0')}h`,
            Requests: d.requests,
            Wins: d.wins,
            Revenue: +d.revenue.toFixed(4),
          }))
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(range); }, [range]);

  const estRevenue = overview
    ? (parseFloat(overview.totalRevenue || 0) * ((publisher?.revShare || 70) / 100)).toFixed(4)
    : '0.0000';

  if (loading) return <div className="text-slate-400 py-20 text-center">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Welcome back, {publisher?.companyName || 'Publisher'}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Requests"   value={(overview?.totalRequests || 0).toLocaleString()} accent="teal" />
        <KPICard label="Total Wins"       value={(overview?.totalWins || 0).toLocaleString()} accent="emerald" />
        <KPICard label="Win Rate"         value={`${overview?.winRate || 0}%`} accent="violet" />
        <KPICard label="Est. Earnings"    value={`$${estRevenue}`} sub={`${publisher?.revShare || 70}% rev share`} accent="amber" />
      </div>

      {/* Chart controls */}
      <div className="flex items-center gap-2">
        {[
          { h: 24, label: '24h' },
          { h: 72, label: '3d' },
          { h: 168, label: '7d' },
        ].map(({ h, label }) => (
          <button key={h} onClick={() => setRange(h)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === h ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Requests & Wins Line Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Requests vs Wins</h2>
        {timeseries.length === 0
          ? <p className="text-slate-500 text-sm text-center py-8">No auction data in this range</p>
          : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Line type="monotone" dataKey="Requests" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Wins" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Revenue Bar Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Revenue (CPM $)</h2>
        {timeseries.length === 0
          ? <p className="text-slate-500 text-sm text-center py-8">No revenue data</p>
          : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Revenue" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Bidder breakdown */}
      {overview?.byBidder?.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Bidder Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left text-xs">
                  <th className="pb-2 pr-4">Bidder</th>
                  <th className="pb-2 pr-4">Requests</th>
                  <th className="pb-2 pr-4">Wins</th>
                  <th className="pb-2">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {overview.byBidder.map(b => (
                  <tr key={b._id} className="border-b border-slate-700/40">
                    <td className="py-2 pr-4 font-medium text-white">{b._id}</td>
                    <td className="py-2 pr-4 text-slate-300">{b.requests}</td>
                    <td className="py-2 pr-4 text-emerald-400">{b.wins}</td>
                    <td className="py-2 text-teal-400">
                      {b.requests > 0 ? ((b.wins / b.requests) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Region breakdown */}
      {overview?.byRegion?.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Traffic by Region</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {overview.byRegion.map(r => (
              <div key={r._id} className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{r._id || 'Unknown'}</p>
                <p className="text-lg font-bold text-white mt-1">{r.requests.toLocaleString()}</p>
                <p className="text-xs text-slate-400">requests</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
